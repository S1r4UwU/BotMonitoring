export class LanguageDetectionService {
  // Indicateurs élargis pour améliorer la précision
  private indicators: Record<string, { common: string[]; specific: string[] }> = {
    fr: {
      common: ['le','la','les','un','une','des','de','du','et','ou','que','qui','avec','pour','dans','sur','est','sont','avoir','être','faire','aller','voir','cette','ce','ça','cette','au','aux','ils','elles','nous','vous'],
      specific: ['bonjour','merci','salut','français','france','paris','très','beaucoup','maintenant','toujours','jamais','peut-être','déjà','encore']
    },
    en: {
      common: ['the','and','or','but','in','on','at','to','for','of','with','by','is','are','was','were','have','has','had','will','would','could','should','this','that','these','those'],
      specific: ['hello','thanks','thank','please','very','really','just','now','always','never','maybe','also','already']
    },
    es: {
      common: ['el','la','los','las','un','una','y','o','de','en','por','para','con','que','es','son','estar','tener','hacer','ser','ir','ver','dar','saber','querer'],
      specific: ['hola','gracias','español','españa','muy','mucho','ahora','siempre','nunca','también','ya']
    },
    de: {
      common: ['der','die','das','und','oder','in','auf','mit','von','zu','ist','sind','haben','sein','werden','können','müssen'],
      specific: ['hallo','danke','bitte','deutsch','deutschland','sehr','wirklich','jetzt']
    }
  };

  detectLanguage(text: string): string {
    return this.detectLanguageDetailed(text).language;
  }

  detectLanguageDetailed(text: string): { language: string; confidence: number } {
    const content = (text || '').toLowerCase();
    const words = content.match(/\b\w+\b/g) || [];
    const total = words.length;
    if (total === 0) return { language: 'unknown', confidence: 0 };

    const scores: Record<string, number> = {};
    Object.entries(this.indicators).forEach(([lang, dict]) => {
      let score = 0;
      for (const w of words) {
        if (dict.common.includes(w)) score += 1;
        if (dict.specific.includes(w)) score += 2; // bonus mots spécifiques
      }
      scores[lang] = score / total;
    });

    let best: { language: string; confidence: number } = { language: 'unknown', confidence: 0 };
    for (const [lang, score] of Object.entries(scores)) {
      if (score > best.confidence) best = { language: lang, confidence: score };
    }
    return best;
  }
}

export default LanguageDetectionService;

