import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { redditAPI } from '@/services/reddit-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const caseId: string = body.caseId;
    if (!caseId) {
      return NextResponse.json({ success: false, error: 'caseId requis' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Charger le cas
    const { data: caseItem, error: caseError } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .single();

    if (caseError || !caseItem) {
      return NextResponse.json({ success: false, error: 'Cas non trouvé' }, { status: 404 });
    }

    // Extraire mots-clés sous forme de liste plate
    const rawKeywords = typeof caseItem.keywords === 'string' ? JSON.parse(caseItem.keywords) : caseItem.keywords;
    const keywords: string[] = Array.isArray(rawKeywords)
      ? rawKeywords.map((k: string) => String(k).replace(/^\s+|\s+$/g, '').replace(/^"|"$/g, ''))
      : [];

    // Recherche Reddit basique SANS filtres avancés
    const mentions = await redditAPI.searchPosts(keywords, [], 25);

    // Déduplication par external_id au niveau du cas
    const externalIds = mentions.map(m => m.external_id);
    const { data: existing, error: existErr } = await supabase
      .from('mentions')
      .select('external_id')
      .eq('case_id', caseId)
      .in('external_id', externalIds);

    if (existErr) {
      console.warn('[WARN] Dédup simple échouée, insertion sans filtre');
    }

    const existingIds = new Set((existing || []).map((r: any) => r.external_id));
    const toInsert = mentions
      .filter(m => !existingIds.has(m.external_id))
      .map(m => ({
        case_id: caseId,
        platform: m.platform,
        external_id: m.external_id,
        content: m.content,
        author_name: m.author_name,
        author_handle: m.author_handle,
        url: m.url,
        published_at: m.published_at,
        sentiment_score: m.sentiment_score,
        urgency_score: m.urgency_score,
        keywords_matched: JSON.stringify(m.keywords_matched || []),
        status: 'new',
        metadata: JSON.stringify(m.metadata || {})
      }));

    let inserted = 0;
    if (toInsert.length > 0) {
      const { data: ins, error: insErr } = await supabase
        .from('mentions')
        .insert(toInsert)
        .select();
      if (insErr) {
        console.error('[ERROR] Insertion mentions (simple) échouée:', insErr);
      } else {
        inserted = ins?.length || 0;
      }
    }

    return NextResponse.json({ success: true, newMentions: inserted });

  } catch (error) {
    console.error('[ERROR] scan-simple:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}


