/**
 * Configuration Supabase pour composants Client uniquement
 * Évite les erreurs "next/headers" dans les composants 'use client'
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

/**
 * Client Supabase pour les composants client ('use client')
 */
export const createClientComponentClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[WARN] Supabase non configuré - création client factice');
    // Créer un client factice qui ne fait rien mais ne plante pas
    const fakeClient = {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: { user: null }, error: { message: 'Supabase non configuré' } }),
        signInWithOAuth: () => Promise.resolve({ error: { message: 'Supabase non configuré' } }),
        signUp: () => Promise.resolve({ data: { user: null }, error: { message: 'Supabase non configuré' } }),
        signOut: () => Promise.resolve({ error: null })
      },
      from: () => ({
        select: () => ({ data: [], count: 0, error: null }),
        insert: () => ({ data: null, error: { message: 'Supabase non configuré' } }),
        update: () => ({ data: null, error: { message: 'Supabase non configuré' } }),
        delete: () => ({ data: null, error: { message: 'Supabase non configuré' } }),
        eq: () => ({ data: [], error: null }),
        single: () => ({ data: null, error: null }),
        order: () => ({ data: [], error: null }),
        range: () => ({ data: [], error: null, count: 0 })
      })
    } as const;
    return fakeClient as unknown as ReturnType<typeof createClient<Database>>;
  }
  
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
};

// Types d'authentification
export type AuthUser = {
  id: string;
  email?: string;
  role?: string;
  full_name?: string;
  company_name?: string;
};
