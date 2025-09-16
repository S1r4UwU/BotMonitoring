import { NextResponse } from 'next/server';
import { redditAPI } from '@/services/reddit-api';
import { youtubeAPI } from '@/services/youtube-api';
import { newsAPI } from '@/services/news-api';
import sentimentAnalysis from '@/services/sentiment-analysis';
import emailAlerts from '@/services/email-alerts';

export async function POST() {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: {}
  };

  // Reddit
  try {
    const redditResults = await redditAPI.searchPosts(['test'], [], 5);
    results.tests.reddit = {
      success: true,
      results_count: redditResults.length,
      first_result: redditResults[0]?.content?.slice(0, 80) || 'Aucun résultat',
      message: `${redditResults.length} posts Reddit trouvés`
    };
  } catch (error: any) {
    results.tests.reddit = { success: false, error: error?.message, message: 'Erreur Reddit API' };
  }

  // YouTube
  try {
    const youtubeResults = await youtubeAPI.search(['test'], 5);
    results.tests.youtube = {
      success: true,
      results_count: youtubeResults.length,
      first_result: youtubeResults[0]?.content?.slice(0, 80) || 'Aucun résultat',
      message: `${youtubeResults.length} vidéos YouTube trouvées`
    };
  } catch (error: any) {
    results.tests.youtube = { success: false, error: error?.message, message: 'Erreur YouTube API' };
  }

  // NewsAPI
  try {
    const newsResults = await newsAPI.search(['france'], ['fr']);
    results.tests.newsapi = {
      success: true,
      results_count: newsResults.length,
      first_result: newsResults[0]?.content?.slice(0, 80) || 'Aucun résultat',
      message: `${newsResults.length} articles trouvés`
    };
  } catch (error: any) {
    results.tests.newsapi = { success: false, error: error?.message, message: 'Erreur News API' };
  }

  // Claude IA
  try {
    const aiResult = await sentimentAnalysis.analyzeSentiment('Ce produit est fantastique !', false, true);
    results.tests.anthropic = {
      success: true,
      sentiment_score: aiResult.score,
      confidence: aiResult.confidence,
      method: aiResult.method,
      message: `Sentiment analysé: ${aiResult.score}/5 (${aiResult.method})`
    };
  } catch (error: any) {
    results.tests.anthropic = { success: false, error: error?.message, message: 'Erreur Claude IA' };
  }

  // Resend Email
  try {
    const emailResult = await emailAlerts.testEmailService('test@example.com');
    results.tests.resend = {
      success: emailResult.success,
      message: emailResult.message,
      email_id: (emailResult as any).emailId || null
    };
  } catch (error: any) {
    results.tests.resend = { success: false, error: error?.message, message: 'Erreur Resend Email' };
  }

  return NextResponse.json(results);
}


