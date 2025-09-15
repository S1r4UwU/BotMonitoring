import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import monitoringEngine from '@/services/monitoring-engine';
import sentimentAnalysis from '@/services/sentiment-analysis';

export async function POST() {
  console.log('🇫🇷 Création et test du cas Emmanuel Macron...');

  const supabase = createAdminClient();

  try {
    const macronCase = {
      name: 'Emmanuel Macron - Test Monitoring',
      description: 'Test de surveillance des mentions du Président',
      keywords: JSON.stringify(['Emmanuel Macron', 'Président', 'Élysée', 'Macron']),
      platforms: JSON.stringify(['reddit', 'youtube', 'newsapi']),
      status: 'active'
    } as any;

    const { data: createdCase, error: caseError } = await supabase
      .from('cases')
      .insert([macronCase])
      .select()
      .single();

    if (caseError) throw caseError;

    console.log('✅ Cas Macron créé:', createdCase.id);

    const scanResult = await monitoringEngine.triggerManualScan(createdCase.id);

    const { data: mentions } = await supabase
      .from('mentions')
      .select('*')
      .eq('case_id', createdCase.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (mentions && mentions.length > 0) {
      for (const mention of mentions.slice(0, 3)) {
        const sentiment = await sentimentAnalysis.analyzeSentiment(mention.content || '', false, false);
        await supabase
          .from('mentions')
          .update({ sentiment_score: sentiment.score })
          .eq('id', mention.id);
      }
    }

    return NextResponse.json({
      success: true,
      case: {
        id: createdCase.id,
        name: createdCase.name,
        created_at: createdCase.created_at
      },
      scan_result: scanResult,
      mentions_found: mentions?.length || 0,
      sample_mentions: (mentions || []).slice(0, 3).map((m: any) => ({
        platform: m.platform,
        content: (m.content || '').substring(0, 100) + '...',
        author: m.author_name,
        sentiment: m.sentiment_score,
        url: m.url
      })),
      message: `Cas Macron créé et scanné avec succès ! ${mentions?.length || 0} mentions trouvées.`
    });

  } catch (error: any) {
    console.error('❌ Erreur test cas Macron:', error);
    return NextResponse.json({
      success: false,
      error: error?.message,
      message: 'Erreur lors du test du cas Macron'
    }, { status: 500 });
  }
}


