/**
 * API Route - Gestion des mentions
 * GET /api/mentions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('[DEBUG] GET /api/mentions appelé');
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const caseId = searchParams.get('caseId');
    const caseIdsParam = searchParams.get('caseIds'); // CSV de IDs

    // FORCER l'usage de Supabase DB
    const supabase = createAdminClient();
    
    let query = supabase
      .from('mentions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (caseId) {
      query = query.eq('case_id', caseId);
    } else if (caseIdsParam) {
      const caseIds = caseIdsParam.split(',').map(x => x.trim()).filter(Boolean);
      if (caseIds.length > 0) {
        query = query.in('case_id', caseIds);
      }
    }

    const { data: mentions, error, count } = await query
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error('[ERROR] Supabase mentions query failed:', error);
      throw error;
    }

    console.log(`[INFO] ${mentions?.length || 0} mentions récupérées depuis Supabase DB (total: ${count})`);
    
    return NextResponse.json({
      success: true,
      data: mentions || [],
      count: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      source: 'supabase'
    });

  } catch (error) {
    console.error('[ERROR] GET /api/mentions:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur',
      data: []
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('[DEBUG] PUT /api/mentions appelé');
    
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({
        success: false,
        error: 'ID et status requis'
      }, { status: 400 });
    }

    // FORCER mise à jour en Supabase DB
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('mentions')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('[ERROR] Update mention status failed:', error);
      throw error;
    }

    console.log('[INFO] Mention status updated in DB:', id, '->', status);
    
    return NextResponse.json({
      success: true,
      message: 'Statut mis à jour'
    });

  } catch (error) {
    console.error('[ERROR] PUT /api/mentions:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur'
    }, { status: 500 });
  }
}
