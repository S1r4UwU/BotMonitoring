// Configuration Supabase pour Next.js 14
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
// ATTENTION: n'importez pas `cookies` si ce fichier est utilisé côté client
// Pour éviter les erreurs, on importera dynamiquement `cookies` uniquement côté serveur
import { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

// Client Supabase pour le côté client
export const createClientComponentClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase non configuré: définissez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local');
  }
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
};

// Client Supabase pour les composants serveur
export const createServerComponentClient = async () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    if (isDemoMode) {
      throw new Error('DEMO_MODE: Supabase désactivé');
    }
    throw new Error('Supabase non configuré côté serveur');
  }
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // ignoré en server components sans capacité de set
        }
      },
    },
  });
};

// Client Supabase pour les routes API
export const createRouteHandlerClient = (request: Request) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    if (isDemoMode) {
      throw new Error('DEMO_MODE: Supabase désactivé');
    }
    throw new Error('Supabase non configuré pour les routes');
  }
  const cookieStore = request.headers.get('cookie');

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          const cookies = cookieStore?.split(';').map(cookie => {
            const [name, ...rest] = cookie.trim().split('=');
            return { name, value: rest.join('=') };
          }) || [];
          return cookies;
        },
        setAll() {
          // Note: Dans un route handler, vous devrez gérer les cookies différemment
        },
      },
    }
  );
};

// Client administrateur avec tous les privilèges
export const createAdminClient = () => {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('[WARN] Supabase admin non configuré - création client factice');
    // Retourner un client factice pour éviter les erreurs
    const fakeAdmin = {
      from: () => ({
        select: () => ({ data: [], count: 0, error: null }),
        insert: () => ({ data: null, error: { message: 'Supabase non configuré' } }),
        update: () => ({ data: null, error: { message: 'Supabase non configuré' } }),
        delete: () => ({ data: null, error: { message: 'Supabase non configuré' } }),
        eq: () => ({ data: [], error: null }),
        single: () => ({ data: null, error: null }),
        order: () => ({ data: [], error: null }),
        range: () => ({ data: [], error: null, count: 0 }),
        upsert: () => ({ data: null, error: null })
      })
    } as const;
    return fakeAdmin as unknown as ReturnType<typeof createClient<Database>>;
  }
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
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

// Helper pour obtenir l'utilisateur actuel
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    // Récupérer les informations du profil
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, company_name, role')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name,
      company_name: profile?.company_name,
      role: profile?.role || 'user',
    };
  } catch {
    return null;
  }
};

// Helper pour vérifier les permissions sur un cas
export const checkCasePermission = async (
  caseId: string,
  userId: string,
  requiredLevel: 'owner' | 'editor' | 'viewer' = 'viewer'
): Promise<boolean> => {
  try {
    const supabase = await createServerComponentClient();
    
    // Vérifier si l'utilisateur est propriétaire du cas
    const { data: caseData } = await supabase
      .from('cases')
      .select('owner_id')
      .eq('id', caseId)
      .single();

    if (caseData?.owner_id === userId) {
      return true;
    }

    // Vérifier les permissions explicites
    const { data: permission } = await supabase
      .from('case_permissions')
      .select('permission_level')
      .eq('case_id', caseId)
      .eq('user_id', userId)
      .single();

    if (!permission) {
      return false;
    }

    // Hiérarchie des permissions : owner > editor > viewer
    const permissionLevels = {
      'owner': 3,
      'editor': 2,
      'viewer': 1,
    };

    return permissionLevels[permission.permission_level] >= permissionLevels[requiredLevel];
  } catch {
    return false;
  }
};

// Helper pour la pagination
export const paginateQuery = <T>(
  query: { range: (from: number, to: number) => T },
  page: number = 1,
  limit: number = 10
) => {
  const offset = (page - 1) * limit;
  return query.range(offset, offset + limit - 1);
};

// Helper pour compter les résultats
export const countQuery = async (
  query: { select: (columns: string, options: { count: 'exact'; head: true }) => Promise<{ count: number | null }> }
): Promise<number> => {
  const { count } = await query.select('*', { count: 'exact', head: true });
  return count || 0;
};

// Configuration RLS policies helper
export const setupRLS = async () => {
  const supabase = createAdminClient();
  
  // Cette fonction pourrait être utilisée pour configurer des policies RLS personnalisées
  // en fonction des besoins spécifiques de l'application
  
  return supabase;
};
