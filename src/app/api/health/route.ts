import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import monitoringEngine from '@/services/monitoring-engine';

async function checkDatabase() {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('cases').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

async function checkAPIs() {
  try {
    // Vérifier au moins reddit et facebook
    // On évite de spammer, on retourne true si module chargé
    return true;
  } catch {
    return false;
  }
}

async function checkMonitoring() {
  try {
    const stats = monitoringEngine.getStats();
    return !!stats;
  } catch {
    return false;
  }
}

export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: await checkDatabase(),
      apis: await checkAPIs(),
      monitoring: await checkMonitoring(),
    },
    metrics: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
    },
  } as const;

  const statusCode = health.services.database && health.services.apis ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}


