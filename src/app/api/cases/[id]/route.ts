/**
 * API Routes - Gestion individuelle des cas
 * GET/PUT/DELETE /api/cases/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

// GET - Récupérer un cas spécifique
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    console.log('[DEBUG] GET /api/cases/[id] appelé, id:', id);
    
    const supabase = createAdminClient();
    const { data: cas, error } = await supabase
      .from('cases')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[ERROR] Récupération cas:', error);
      throw error;
    }

    if (!cas) {
      return NextResponse.json({
        success: false,
        error: 'Cas introuvable'
      }, { status: 404 });
    }

    console.log('[INFO] Cas récupéré:', cas.name);
    
    return NextResponse.json({
      success: true,
      data: cas
    });

  } catch (error) {
    console.error('[ERROR] GET /api/cases/[id]:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur'
    }, { status: 500 });
  }
}

// PUT - Modifier un cas
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    console.log('[DEBUG] PUT /api/cases/[id] appelé, id:', id);
    
    const body = await request.json();
    console.log('[DEBUG] Données mise à jour:', body);

    const supabase = createAdminClient();
    
    // Préparer les données à mettre à jour
    const updateData: Partial<{
      name: string;
      description: string | null;
      keywords: string;
      platforms: string;
      status: string;
      updated_at: string;
    }> = {};
    
    if (body.name) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.keywords) updateData.keywords = JSON.stringify(body.keywords);
    if (body.platforms) updateData.platforms = JSON.stringify(body.platforms);
    if (body.status) updateData.status = body.status;
    
    updateData.updated_at = new Date().toISOString();

    const { data: updatedCase, error } = await supabase
      .from('cases')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[ERROR] Mise à jour cas:', error);
      throw error;
    }

    console.log('[INFO] Cas mis à jour avec succès:', updatedCase.name);
    
    return NextResponse.json({
      success: true,
      data: updatedCase,
      message: 'Cas mis à jour avec succès'
    });

  } catch (error) {
    console.error('[ERROR] PUT /api/cases/[id]:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour'
    }, { status: 500 });
  }
}

// DELETE - Supprimer un cas
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    console.log('[DEBUG] DELETE /api/cases/[id] appelé, id:', id);

    const supabase = createAdminClient();
    
    // Supprimer le cas (les mentions liées seront supprimées par CASCADE)
    const { error } = await supabase
      .from('cases')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[ERROR] Suppression cas:', error);
      throw error;
    }

    console.log('[INFO] Cas supprimé avec succès:', id);
    
    return NextResponse.json({
      success: true,
      message: 'Cas supprimé avec succès'
    });

  } catch (error) {
    console.error('[ERROR] DELETE /api/cases/[id]:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la suppression'
    }, { status: 500 });
  }
}
