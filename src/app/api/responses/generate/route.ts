import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { mentionId, mentionContent, caseName, responseType = 'professional', responseTypes } = await request.json();

    if (!mentionId || !mentionContent || !caseName) {
      return NextResponse.json({ error: 'mentionId, mentionContent et caseName requis' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY manquante' }, { status: 400 });
    }

    const basePrompt = (tone: string) => `
Tu es un community manager professionnel.
Contexte: Le cas surveillé s'appelle "${caseName}" (marque/entreprise ou projet). Ne confonds jamais une personnalité publique avec une entreprise.

MENTION ORIGINALE:
"""
${mentionContent}
"""

INSTRUCTIONS:
- Génère une réponse ${tone} adaptée au contexte du commentaire ci-dessus
- Reste calme, factuel, respectueux, sans agressivité
- Si la cible est une personnalité publique (ex: président), ne prétends pas qu'il s'agit d'une entreprise
- Propose une action concrète si pertinent (contact, lien support, clarification factuelle)
- Maximum 220 caractères
- Langue: français
- Pas d'hashtags, pas d'emojis, pas de mentions inutiles

RÉPONSE:
`;

    const tryGenerate = async (model: string, content: string) => fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY as string,
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: 200,
        messages: [{ role: 'user', content }]
      })
    });

    const preferredModel = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20240620';
    const fallbackModels = [preferredModel, 'claude-3-opus-20240229', 'claude-3-haiku-20240307'];

    const tonesMap: Record<string, string> = {
      professional: 'professionnelle',
      empathetic: 'empathique',
      firm: 'ferme mais polie'
    };

    const requestedTypes: string[] = Array.isArray(responseTypes) && responseTypes.length
      ? responseTypes
      : [responseType, 'empathetic', 'firm'];

    const variants: { type: string; text: string }[] = [];

    for (const t of requestedTypes) {
      const content = basePrompt(tonesMap[t] || 'professionnelle');
      let aiRes = await tryGenerate(fallbackModels[0], content);

      if (!aiRes.ok) {
        const txt = await aiRes.text();
        if (aiRes.status === 404) {
          for (let i = 1; i < fallbackModels.length; i++) {
            const alt = await tryGenerate(fallbackModels[i], content);
            if (alt.ok) { aiRes = alt; break; }
          }
        }
        if (!aiRes.ok) {
          const status = aiRes.status;
          const message = status === 401
            ? 'Clé Anthropic invalide (401). Vérifiez ANTHROPIC_API_KEY.'
            : `Anthropic API error: ${txt}. Essayez ANTHROPIC_MODEL=claude-3-haiku-20240307`;
          return NextResponse.json({ error: message }, { status: 400 });
        }
      }

      const aiJson = await aiRes.json();
      const text: string = aiJson?.content?.[0]?.text || '';
      if (text) variants.push({ type: t, text });
    }

    if (!variants.length) {
      return NextResponse.json({ error: 'Réponse IA vide' }, { status: 500 });
    }

    const supabase = createAdminClient();
    const { data: saved, error } = await supabase
      .from('responses')
      .insert([{ mention_id: mentionId, generated_text: variants[0].text, status: 'draft', response_type: variants[0].type }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, response: variants[0].text, variants, responseId: saved.id });
  } catch (error) {
    console.error('[ERROR] Génération réponse:', error);
    return NextResponse.json({ error: 'Erreur génération IA' }, { status: 500 });
  }
}


