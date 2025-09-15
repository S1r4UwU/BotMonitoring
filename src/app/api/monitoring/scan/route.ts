/**
 * API Route - Scan manuel de monitoring
 * POST /api/monitoring/scan
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';
import { monitoringEngine } from '@/services/monitoring-engine';

export async function POST(request: NextRequest) {
  try {
    // Authentification requise sauf en mode démo
    const supabase = createRouteHandlerClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!process.env.NEXT_PUBLIC_DEMO_MODE && (!user || authError)) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { caseId } = await request.json();

    if (!caseId) {
      return NextResponse.json(
        { error: 'Case ID required' },
        { status: 400 }
      );
    }

    // Vérifier les permissions sur le cas (sauf en mode démo)
    if (!process.env.NEXT_PUBLIC_DEMO_MODE && user) {
      const { data: hasPermission } = await supabase
        .from('cases')
        .select('id')
        .eq('id', caseId)
        .eq('owner_id', user.id)
        .single();

      if (!hasPermission) {
        return NextResponse.json(
          { error: 'Access denied to this case' },
          { status: 403 }
        );
      }
    }

    // Déclencher le scan
    const result = await monitoringEngine.triggerManualScan(caseId);

    return NextResponse.json({
      success: result.success,
      mentionsFound: result.mentionsFound,
      error: result.error,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur API scan monitoring:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Obtenir les statistiques du moteur de monitoring
    const stats = monitoringEngine.getStats();
    const jobs = monitoringEngine.getActiveJobs();

    return NextResponse.json({
      stats,
      activeJobs: jobs.length,
      jobs: jobs.map(job => ({
        caseId: job.caseId,
        platforms: job.platforms,
        keywords: job.keywords,
        interval: job.interval,
        lastRun: job.lastRun,
        isRunning: job.isRunning
      }))
    });

  } catch (error) {
    console.error('Erreur API stats monitoring:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
