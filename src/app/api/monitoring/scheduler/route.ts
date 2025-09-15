/**
 * API Route - Contrôle du Scheduler de Monitoring
 * GET/POST /api/monitoring/scheduler
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';
import { monitoringScheduler } from '@/services/monitoring-scheduler';

export async function GET(request: NextRequest) {
  try {
    // Authentification requise sauf en mode démo
    if (!process.env.NEXT_PUBLIC_DEMO_MODE) {
      const supabase = createRouteHandlerClient(request);
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (!user || authError) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    }

    // Obtenir le statut du scheduler
    const status = monitoringScheduler.getStatus();

    return NextResponse.json({
      success: true,
      scheduler: status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur API scheduler status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentification requise sauf en mode démo
    if (!process.env.NEXT_PUBLIC_DEMO_MODE) {
      const supabase = createRouteHandlerClient(request);
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (!user || authError) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    }

    const { action, taskName, config } = await request.json();

    switch (action) {
      case 'start':
        monitoringScheduler.start();
        break;
        
      case 'stop':
        monitoringScheduler.stop();
        break;
        
      case 'trigger':
        if (!taskName) {
          return NextResponse.json(
            { error: 'Task name required for trigger action' },
            { status: 400 }
          );
        }
        await monitoringScheduler.triggerTask(taskName);
        break;
        
      case 'updateConfig':
        if (!config) {
          return NextResponse.json(
            { error: 'Config required for updateConfig action' },
            { status: 400 }
          );
        }
        monitoringScheduler.updateConfig(config);
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: start, stop, trigger, updateConfig' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      scheduler: monitoringScheduler.getStatus(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur API scheduler control:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
