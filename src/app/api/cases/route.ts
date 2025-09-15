/**
 * API Routes - Gestion des cas de monitoring
 * GET/POST /api/cases
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { z } from 'zod';

// Schéma de validation pour création de cas (ajout filtres)
const createCaseSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  description: z.string().optional(),
  keywords: z.array(z.string()).min(1, 'Au moins un mot-clé requis'),
  platforms: z.array(z.enum(['facebook', 'instagram', 'reddit'])).min(1, 'Au moins une plateforme requise'),
  filters: z.object({
    languages: z.array(z.string()).default([]),
    countries: z.array(z.string()).default([]),
    excludeLanguages: z.array(z.string()).default([]),
    timeRange: z.string().default('7d')
  }).optional()
});

// GET - Récupérer tous les cas
export async function GET() {
  try {
    console.log('[DEBUG] GET /api/cases appelé');
    
    // FORCER l'usage de Supabase DB maintenant
    const supabase = createAdminClient();
    const { data: cases, error } = await supabase
      .from('cases')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[ERROR] Supabase query failed:', error);
      throw error;
    }

    console.log(`[INFO] ${cases?.length || 0} cas récupérés depuis Supabase DB`);
    
    return NextResponse.json({
      success: true,
      data: cases || [],
      count: cases?.length || 0,
      source: 'supabase'
    });

  } catch (error) {
    console.error('[ERROR] GET /api/cases:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur',
      data: []
    }, { status: 500 });
  }
}

// POST - Créer un nouveau cas
export async function POST(request: NextRequest) {
  try {
    console.log('[DEBUG] POST /api/cases appelé');
    
    const body = await request.json();
    console.log('[DEBUG] Body reçu:', body);

    // Validation des données
    const validationResult = createCaseSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('[ERROR] Validation failed:', validationResult.error);
      return NextResponse.json({
        success: false,
        error: 'Données invalides',
        details: validationResult.error.errors
      }, { status: 400 });
    }

    const { name, description, keywords, platforms, filters } = validationResult.data;

    // FORCER la vraie insertion Supabase DB
    const supabase = createAdminClient();
    
    const { data: newCase, error: caseError } = await supabase
      .from('cases')
      .insert({
        name,
        description,
        keywords: JSON.stringify(keywords),
        platforms: JSON.stringify(platforms),
        status: 'active'
      })
      .select()
      .single();

    if (caseError) {
      console.error('[ERROR] Case creation failed:', caseError);
      throw caseError;
    }

    console.log('[INFO] Cas créé avec succès en Supabase DB:', newCase.id);

    return NextResponse.json({
      success: true,
      data: newCase,
      message: 'Cas créé avec succès en base de données',
      source: 'supabase'
    });

  } catch (error) {
    console.error('[ERROR] POST /api/cases:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la création du cas'
    }, { status: 500 });
  }
}
