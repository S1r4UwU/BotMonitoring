import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import LanguageDetectionService from '@/services/nlp/language-detection';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const caseId = params.id;
    const supabase = createAdminClient();
    const { data: mentions, error } = await supabase
      .from('mentions')
      .select('content')
      .eq('case_id', caseId);

    if (error) throw error;

    const langService = new LanguageDetectionService();
    const distribution: Record<string, number> = {};
    let highConfidence = 0;
    let filtered = 0;
    let confidenceSum = 0;

    ((mentions as Array<{ content: string }>) || []).forEach((m) => {
      const det = langService.detectLanguageDetailed(m.content || '');
      distribution[det.language] = (distribution[det.language] || 0) + 1;
      if (det.confidence >= 0.10) highConfidence++;
      if (det.confidence < 0.06) filtered++;
      confidenceSum += det.confidence;
    });

    const totalDetected = mentions?.length || 0;
    const averageConfidence = totalDetected > 0 ? confidenceSum / totalDetected : 0;

    return NextResponse.json({
      totalDetected,
      highConfidence,
      filtered,
      languageDistribution: distribution,
      averageConfidence
    });
  } catch (error) {
    console.error('[ERROR] Language metrics:', error);
    return NextResponse.json({ error: 'Erreur métriques' }, { status: 500 });
  }
}


