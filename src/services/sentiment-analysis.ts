/**
 * Service d'Analyse de Sentiment Frugal
 * Budget <10€/mois : lexique gratuit + IA premium pour cas critiques
 */

import axios from 'axios';

interface SentimentResult {
  score: number; // -5 à +5
  confidence: number; // 0 à 1
  method: 'lexicon' | 'ai_claude' | 'ai_openai';
  reasoning?: string;
  cost?: number; // en centimes
}

interface WordScore {
  [word: string]: number;
}

class SentimentAnalysisService {
  private claudeApiKey: string;
  private openaiApiKey: string;
  private monthlyAIUsage = 0; // en centimes
  private maxMonthlyBudget = 1000; // 10€ en centimes
  private aiUsageResetDate: Date;

  // Lexique de sentiment français/anglais (gratuit)
  private positiveWords: WordScore = {
    // Français
    'excellent': 2, 'parfait': 2, 'fantastique': 2, 'génial': 2, 'super': 1.5,
    'bien': 1, 'bon': 1, 'content': 1.5, 'satisfait': 1.5, 'heureux': 2,
    'recommande': 1.5, 'top': 1, 'merci': 1, 'bravo': 1.5, 'impressionnant': 2,
    // Anglais
    'excellent': 2, 'perfect': 2, 'fantastic': 2, 'awesome': 2, 'great': 1.5,
    'good': 1, 'nice': 1, 'happy': 1.5, 'satisfied': 1.5, 'love': 2,
    'recommend': 1.5, 'amazing': 2, 'wonderful': 2, 'outstanding': 2
  };

  private negativeWords: WordScore = {
    // Français
    'terrible': -2, 'horrible': -2, 'nul': -1.5, 'mauvais': -1, 'déçu': -1.5,
    'problème': -1, 'erreur': -1, 'bug': -1, 'lent': -1, 'cher': -0.5,
    'arnaque': -2, 'scandale': -2, 'boycott': -2, 'fraude': -2, 'pire': -2,
    // Anglais
    'terrible': -2, 'horrible': -2, 'awful': -2, 'bad': -1, 'disappointed': -1.5,
    'problem': -1, 'error': -1, 'bug': -1, 'slow': -1, 'expensive': -0.5,
    'scam': -2, 'fraud': -2, 'worst': -2, 'hate': -2, 'boycott': -2
  };

  constructor() {
    this.claudeApiKey = process.env.ANTHROPIC_API_KEY || '';
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
    this.aiUsageResetDate = this.getNextMonthStart();
  }

  /**
   * Analyse le sentiment d'un texte avec approche frugale
   */
  async analyzeSentiment(
    text: string, 
    isUrgent = false, 
    forceAI = false
  ): Promise<SentimentResult> {
    // Reset du budget mensuel si nécessaire
    this.checkBudgetReset();

    // Méthode lexique d'abord (gratuite)
    const lexiconResult = this.analyzeSentimentLexicon(text);

    // Utiliser l'IA seulement si :
    // 1. Cas urgent ET budget disponible
    // 2. Force AI demandé
    // 3. Sentiment lexique très négatif (< -3)
    const useAI = (
      (isUrgent || forceAI || lexiconResult.score <= -3) && 
      this.canUseAI()
    );

    if (useAI) {
      try {
        const aiResult = await this.analyzeSentimentAI(text);
        return aiResult;
      } catch {
        console.warn('IA sentiment analysis failed, fallback to lexicon');
        return lexiconResult;
      }
    }

    return lexiconResult;
  }

  /**
   * Analyse de sentiment basée sur lexique (gratuite)
   */
  private analyzeSentimentLexicon(text: string): SentimentResult {
    const words = this.tokenizeText(text);
    let totalScore = 0;
    let wordCount = 0;

    words.forEach(word => {
      const lowerWord = word.toLowerCase();
      
      if (this.positiveWords[lowerWord]) {
        totalScore += this.positiveWords[lowerWord];
        wordCount++;
      } else if (this.negativeWords[lowerWord]) {
        totalScore += this.negativeWords[lowerWord];
        wordCount++;
      }
    });

    // Normaliser le score (-5 à +5)
    let normalizedScore = 0;
    if (wordCount > 0) {
      const avgScore = totalScore / wordCount;
      normalizedScore = Math.max(-5, Math.min(5, avgScore * 2));
    }

    // Ajustements contextuels
    normalizedScore = this.applyContextualAdjustments(text, normalizedScore);

    return {
      score: Math.round(normalizedScore * 10) / 10, // 1 décimale
      confidence: wordCount > 0 ? Math.min(0.8, wordCount * 0.1) : 0.1,
      method: 'lexicon',
      cost: 0
    };
  }

  /**
   * Analyse de sentiment avec IA (Claude 3.5 Sonnet)
   */
  private async analyzeSentimentAI(text: string): Promise<SentimentResult> {
    if (!this.claudeApiKey) {
      throw new Error('Claude API key non configurée');
    }

    const prompt = `Analyse le sentiment de ce texte et réponds UNIQUEMENT avec un JSON:
{
  "score": <nombre entre -5 et +5>,
  "confidence": <nombre entre 0 et 1>,
  "reasoning": "<explication courte en 1 phrase>"
}

Score: -5 très négatif, -3 négatif, 0 neutre, +3 positif, +5 très positif

Texte à analyser:
"${text.slice(0, 500)}"`;

    try {
      const response = await axios.post('https://api.anthropic.com/v1/messages', {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 150,
        messages: [{
          role: 'user',
          content: prompt
        }]
      }, {
        headers: {
          'Authorization': `Bearer ${this.claudeApiKey}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        timeout: 10000
      });

      const aiResponse = JSON.parse(response.data.content[0].text);
      const estimatedCost = this.estimateClaudeCost(prompt.length + 150); // estimation

      // Mettre à jour l'usage
      this.monthlyAIUsage += estimatedCost;

      return {
        score: Math.max(-5, Math.min(5, aiResponse.score)),
        confidence: Math.max(0, Math.min(1, aiResponse.confidence)),
        method: 'ai_claude',
        reasoning: aiResponse.reasoning,
        cost: estimatedCost
      };

    } catch {
      console.error('Erreur Claude API');
      throw new Error('Erreur Claude API');
    }
  }

  /**
   * Tokenise le texte en mots
   */
  private tokenizeText(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
  }

  /**
   * Applique des ajustements contextuels au score
   */
  private applyContextualAdjustments(text: string, baseScore: number): number {
    let adjustedScore = baseScore;
    const lowerText = text.toLowerCase();

    // Négation (pas, ne... pas, not, don't)
    const negationPattern = /\b(pas|ne|not|don't|didn't|isn't|aren't)\b/g;
    const negations = lowerText.match(negationPattern);
    if (negations && negations.length > 0) {
      adjustedScore = adjustedScore * -0.8; // Inverse partiellement
    }

    // Intensificateurs
    if (lowerText.includes('très') || lowerText.includes('extremely') || lowerText.includes('vraiment')) {
      adjustedScore = adjustedScore * 1.3;
    }

    // Questions (généralement neutres)
    if (lowerText.includes('?')) {
      adjustedScore = adjustedScore * 0.7;
    }

    // Exclamations (intensifient le sentiment)
    const exclamations = (lowerText.match(/!/g) || []).length;
    if (exclamations > 0) {
      adjustedScore = adjustedScore * (1 + exclamations * 0.1);
    }

    return adjustedScore;
  }

  /**
   * Vérifie si on peut utiliser l'IA (budget disponible)
   */
  private canUseAI(): boolean {
    return this.monthlyAIUsage < this.maxMonthlyBudget;
  }

  /**
   * Estime le coût d'une requête Claude
   */
  private estimateClaudeCost(tokenCount: number): number {
    // Claude 3.5 Sonnet : ~$3 par million de tokens input, ~$15 par million output
    const inputCost = (tokenCount * 0.3) / 1000; // 0.3 centimes par 1000 tokens
    const outputCost = (150 * 1.5) / 1000; // 150 tokens output estimés
    return Math.ceil(inputCost + outputCost);
  }

  /**
   * Vérifie et reset le budget mensuel
   */
  private checkBudgetReset(): void {
    const now = new Date();
    if (now >= this.aiUsageResetDate) {
      this.monthlyAIUsage = 0;
      this.aiUsageResetDate = this.getNextMonthStart();
      console.log('💰 Budget IA mensuel réinitialisé');
    }
  }

  /**
   * Obtient le début du mois prochain
   */
  private getNextMonthStart(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  /**
   * Analyse en lot (batch) pour optimiser les coûts
   */
  async analyzeBatch(texts: string[], forceAI = false): Promise<SentimentResult[]> {
    const results: SentimentResult[] = [];

    for (const text of texts) {
      // Analyser d'abord avec lexique
      const lexiconResult = this.analyzeSentimentLexicon(text);
      
      // Utiliser l'IA seulement pour les cas critiques
      const needsAI = forceAI || lexiconResult.score <= -3 || lexiconResult.confidence < 0.3;
      
      if (needsAI && this.canUseAI()) {
        try {
          const aiResult = await this.analyzeSentimentAI(text);
          results.push(aiResult);
        } catch {
          results.push(lexiconResult); // fallback
        }
      } else {
        results.push(lexiconResult);
      }

      // Petite pause pour éviter le rate limiting
      if (needsAI) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  /**
   * Obtient les statistiques d'usage IA
   */
  getUsageStats() {
    return {
      monthlyUsage: this.monthlyAIUsage,
      maxBudget: this.maxMonthlyBudget,
      usagePercent: (this.monthlyAIUsage / this.maxMonthlyBudget) * 100,
      remainingBudget: this.maxMonthlyBudget - this.monthlyAIUsage,
      resetDate: this.aiUsageResetDate,
      canUseAI: this.canUseAI()
    };
  }

  /**
   * Met à jour le budget mensuel maximum
   */
  setMaxBudget(budgetInCents: number) {
    this.maxMonthlyBudget = Math.max(0, budgetInCents);
    console.log(`💰 Budget IA mensuel mis à jour: ${budgetInCents/100}€`);
  }

  /**
   * Test de fonctionnement du service
   */
  async testService(): Promise<{ lexicon: Array<{ score: number; confidence: number; method: string; reasoning?: string; cost?: number }>; ai?: Record<string, unknown>; budget: ReturnType<SentimentAnalysisService['getUsageStats']> }> {
    const testTexts = [
      "J'adore ce produit, il est parfait !",
      "C'est terrible, je suis très déçu",
      "Le produit est correct, sans plus"
    ];

    const lexiconResults = testTexts.map(text => 
      this.analyzeSentimentLexicon(text)
    );

    let aiResult;
    if (this.canUseAI() && this.claudeApiKey) {
      try {
        aiResult = await this.analyzeSentimentAI(testTexts[1]); // texte négatif
      } catch {
        aiResult = { error: 'Erreur IA' };
      }
    }

    return {
      lexicon: lexiconResults,
      ai: aiResult,
      budget: this.getUsageStats()
    };
  }
}

// Instance singleton
export const sentimentAnalysis = new SentimentAnalysisService();
export default sentimentAnalysis;
