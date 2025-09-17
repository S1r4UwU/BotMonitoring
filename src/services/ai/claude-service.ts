import type { Mention } from '@/models/types';

export class ClaudeResponseGenerator {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY || '';
  }

  async generatePersonalizedResponse(
    mention: Mention,
    context: 'cybersecurity' | 'business' | 'crypto' | 'general'
  ): Promise<string> {
    const contextPrompts: Record<string, string> = {
      cybersecurity: "Tu réponds en tant qu'expert cybersécurité basé à Lyon. Professionnel, technique, rassurant.",
      business: "Tu réponds en tant qu'entrepreneur spécialisé cybersécurité à Lyon. Orienté solutions, collaboratif.",
      crypto: "Tu réponds en tant que développeur blockchain expérimenté. Factuel, prudent sur les conseils financiers.",
      general: 'Tu réponds de manière professionnelle et utile.'
    };

    const prompt = `
${contextPrompts[context]}

Contexte: ${mention.content}
Plateforme: ${mention.platform}
Sentiment: ${mention.sentiment_score}

Génère une réponse de 1-2 phrases maximum, naturelle et engageante.
Évite le spam, concentre-toi sur l'apport de valeur.
`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 150,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) throw new Error('Claude API Error');
      const result = await response.json();
      return (result?.content?.text || '').trim();
    } catch (error) {
      console.error('Claude API Error:', error);
      return this.getFallbackResponse(context);
    }
  }

  private getFallbackResponse(context: string): string {
    const fallbacks: Record<string, string> = {
      cybersecurity: "Merci pour ce partage. En tant que professionnel de la cybersécurité, je suis toujours intéressé par ces sujets. N'hésitez pas si vous avez des questions.",
      business: "Intéressant ! Je serais ravi d'échanger sur ce sujet. Mon expertise en cybersécurité pourrait être complémentaire.",
      crypto: "Point intéressant. La sécurité reste fondamentale dans l'écosystème crypto. Prudence sur les investissements.",
      general: 'Merci pour ce partage intéressant !'
    };
    return fallbacks[context] || fallbacks.general;
  }
}

export const claudeResponseGenerator = new ClaudeResponseGenerator();


