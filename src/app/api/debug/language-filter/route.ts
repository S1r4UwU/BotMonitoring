import { NextResponse } from 'next/server';
import LanguageDetectionService from '@/services/nlp/language-detection';

export async function GET() {
  const sampleTexts = [
    'Pizza italiana molto buona! Consiglio questo ristorante.',
    'Pizza is really good here, I love this place!',
    'Cette pizza est délicieuse, je recommande ce restaurant français.',
    'Pizza 🍕 yummy yummy 😋',
    'قالب:پیتزا خیلی خوب است'
  ];

  const languageService = new LanguageDetectionService();
  const results = sampleTexts.map(text => {
    const detection = languageService.detectLanguageDetailed(text);
    return {
      text: text.substring(0, 50) + '...',
      ...detection,
      wouldBeFilteredAt006: detection.confidence < 0.06,
      wouldBeFilteredAt010: detection.confidence < 0.10
    };
  });

  return NextResponse.json({
    testResults: results,
    thresholds: { permissive: 0.03, standard: 0.06, strict: 0.10 }
  });
}


