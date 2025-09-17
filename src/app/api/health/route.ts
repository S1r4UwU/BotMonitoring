import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import monitoringEngine from '@/services/monitoring-engine';
import { cacheService } from '@/lib/cache';

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
  // Checks détaillés
  const checks = await Promise.allSettled([
    (async () => {
      const start = Date.now();
      const ok = await checkDatabase();
      return { service: 'supabase', status: ok ? 'healthy' : 'down', responseTime: Date.now() - start };
    })(),
    (async () => {
      const start = Date.now();
      try {
        await cacheService.cacheAPIResponse('health:check', { ping: 'pong' }, 60);
        const res = await cacheService.getAPIResponse<{ ping: string }>('health:check');
        return { service: 'redis', status: res?.ping === 'pong' ? 'healthy' : 'degraded', responseTime: Date.now() - start };
      } catch (e) {
        return { service: 'redis', status: 'down', responseTime: Date.now() - start, details: 'Redis unavailable' };
      }
    })(),
    (async () => {
      const start = Date.now();
      const ok = await checkMonitoring();
      return { service: 'monitoring', status: ok ? 'healthy' : 'down', responseTime: Date.now() - start };
    })(),
  ]);

  const flattened = checks.map(c => c.status === 'fulfilled' ? c.value : { service: 'unknown', status: 'down', details: 'check failed' });

  // Circuit breakers
  const circuits = monitoringEngine.getCircuitBreakerStatus();
  const circuitChecks = Object.entries(circuits).map(([platform, state]) => ({
    service: `circuit_breaker_${platform}`,
    status: state === 'CLOSED' ? 'healthy' : state === 'HALF_OPEN' ? 'degraded' : 'down',
  }));

  const allChecks = [...flattened, ...circuitChecks];
  const allHealthy = allChecks.every(c => c.status === 'healthy');
  const hasDegraded = allChecks.some(c => c.status === 'degraded');

  return NextResponse.json({
    status: allHealthy ? 'healthy' : hasDegraded ? 'degraded' : 'down',
    timestamp: new Date().toISOString(),
    checks: allChecks,
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
  }, { status: allHealthy ? 200 : hasDegraded ? 206 : 503 });
}


