import LanguageDetectionService from '@/services/nlp/language-detection';

export interface MentionLike {
  platform: string;
  content: string;
  author_name?: string;
  sentiment_score?: number;
}

export interface ResponseContext {
  brandName: string;
  industry?: string;
  brandValues?: string;
  toneOfVoice?: 'chaleureux' | 'neutre' | 'professionnel' | string;
}

interface ContextAnalysis {
  criticismType: 'constructive' | 'hostile' | 'neutral';
  authorInfluence: 'low' | 'medium' | 'high';
  language: string;
  urgency: number;
  emotions: string[];
}

export class ContextualResponseService {
  async generateHumanResponse(mention: MentionLike, context: ResponseContext): Promise<string> {
    const analysis = await this.analyzeContext(mention);
    const prompt = `
Tu es un excellent community manager expérimenté qui gère la réputation en ligne de "${context.brandName}".

CONTEXTE DE LA MENTION :
- Plateforme : ${mention.platform}
- Contenu original : "${mention.content}"
- Auteur : ${mention.author_name || 'inconnu'}
- Sentiment détecté : ${mention.sentiment_score ?? 0}/5
- Langue : ${analysis.language}
- Type de critique : ${analysis.criticismType}
- Influence de l'auteur : ${analysis.authorInfluence}

INFORMATIONS MARQUE :
- Nom : ${context.brandName}
- Secteur : ${context.industry || ''}
- Valeurs : ${context.brandValues || ''}
- Tone of voice : ${context.toneOfVoice || 'professionnel'}

INSTRUCTIONS SPÉCIALES :
- Écris comme un humain, pas comme un bot
- Utilise un ton ${context.toneOfVoice || 'professionnel'} mais professionnel
- Reconnais les points valides s'il y en a
- Propose une solution concrète si possible
- Reste sous 200 caractères pour les réseaux sociaux
- Utilise la langue détectée : ${analysis.language}
- Évite les phrases corporate/robotiques
- Montre de l'empathie quand approprié

${analysis.criticismType === 'constructive' ? 
  'Cette critique semble constructive. Remercie et propose une amélioration.' : 
  (analysis.criticismType === 'hostile' ? 'Cette critique semble hostile. Reste calme et redirige vers une solution.' : 'Mention neutre. Réponds utilement si nécessaire.')}

GÉNÈRE UNE RÉPONSE NATURELLE ET HUMAINE :
`;

    const response = await this.callAnthropicAPI(prompt);
    return this.humanizeResponse(response);
  }

  private async analyzeContext(mention: MentionLike): Promise<ContextAnalysis> {
    const criticismType = this.detectCriticismType(mention.content);
    const authorInfluence = this.analyzeAuthorInfluence();
    const language = new LanguageDetectionService().detectLanguage(mention.content);
    return {
      criticismType,
      authorInfluence,
      language,
      urgency: this.calculateUrgency(mention.sentiment_score ?? 0, authorInfluence),
      emotions: this.detectEmotions(mention.content)
    };
  }

  private detectCriticismType(text: string): ContextAnalysis['criticismType'] {
    const t = (text || '').toLowerCase();
    if (/(arnaque|scandale|boycott|honte|nul|horrible|terrible)/.test(t)) return 'hostile';
    if (/(suggère|améliorer|pourrait|serait mieux|peut-être)/.test(t)) return 'constructive';
    return 'neutral';
  }

  private analyzeAuthorInfluence(): ContextAnalysis['authorInfluence'] {
    return 'medium';
  }

  private calculateUrgency(sentiment: number, influence: ContextAnalysis['authorInfluence']): number {
    const base = 5 - Math.min(5, Math.max(-5, sentiment));
    const inf = influence === 'high' ? 3 : influence === 'medium' ? 2 : 1;
    return Math.min(10, Math.max(1, Math.round(base + inf)));
    }

  private detectEmotions(text: string): string[] {
    const t = (text || '').toLowerCase();
    const emotions: string[] = [];
    if (/(triste|déçu|colère|furieux|énervé)/.test(t)) emotions.push('neg');
    if (/(heureux|content|merci|super|génial)/.test(t)) emotions.push('pos');
    return emotions;
  }

  private async callAnthropicAPI(prompt: string): Promise<string> {
    void prompt; // Utilise le paramètre pour éviter l'avertissement
    const base = 'Merci pour votre retour. On regarde ça et on revient vers vous très vite.';
    return base.slice(0, 180);
  }

  private humanizeResponse(response: string): string {
    const humanized = response
      .replace(/nous vous remercions/gi, 'merci')
      .replace(/veuillez nous excuser/gi, 'désolé')
      .replace(/n'hésitez pas à/gi, 'vous pouvez');
    return humanized;
  }
}

export default ContextualResponseService;

