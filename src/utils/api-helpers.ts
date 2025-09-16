/**
 * Helpers pour les appels API et gestion d'erreurs
 */

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

/**
 * Wrapper pour les appels API avec gestion d'erreurs standardisée
 */
export async function apiCall<T>(
  url: string, 
  options?: RequestInit
): Promise<APIResponse<T>> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}: ${response.statusText}`,
        timestamp: new Date().toISOString()
      };
    }

    return {
      success: true,
      data: data as T,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Retry logic pour les appels API qui peuvent échouer
 */
export async function apiCallWithRetry<T>(
  url: string, 
  options?: RequestInit,
  maxRetries = 3,
  delay = 1000
): Promise<APIResponse<T>> {
  let lastError: APIResponse<T>;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await apiCall<T>(url, options);
    
    if (result.success) {
      return result;
    }

    lastError = result;
    
    // Pas de retry sur les erreurs d'authentification ou de validation
    if (url.includes('auth') || result.error?.includes('required')) {
      break;
    }

    // Attendre avant le prochain essai
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  return lastError!;
}

/**
 * Helper pour les requêtes paginées
 */
export interface PaginatedAPICall<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export async function paginatedApiCall<T>(
  url: string,
  page = 1,
  limit = 20,
  options?: RequestInit
): Promise<APIResponse<PaginatedAPICall<T>>> {
  const searchParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });

  const fullUrl = `${url}?${searchParams}`;
  return apiCall<PaginatedAPICall<T>>(fullUrl, options);
}

/**
 * Validation des réponses API
 */
export function validateAPIResponse<T extends Record<string, unknown>>(
  response: unknown,
  requiredFields: string[]
): response is T {
  if (!response || typeof response !== 'object') {
    return false;
  }

  return requiredFields.every(field => 
    field in response && response[field] !== undefined
  );
}

/**
 * Helper pour formater les erreurs API de manière user-friendly
 */
export function formatAPIError(error: string): string {
  const errorMappings: Record<string, string> = {
    'Authentication required': 'Connexion requise',
    'Access denied': 'Accès refusé',
    'Rate limit exceeded': 'Quota dépassé - réessayez plus tard',
    'Internal server error': 'Erreur serveur - contactez le support',
    'Network error': 'Erreur de connexion - vérifiez votre réseau',
    'Invalid input': 'Données invalides',
    'Resource not found': 'Ressource introuvable'
  };

  return errorMappings[error] || error;
}

/**
 * Helper pour les timeouts configurable selon l'API
 */
export function getAPITimeout(apiType: 'facebook' | 'reddit' | 'sentiment' | 'email'): number {
  const timeouts = {
    facebook: 15000,  // 15s pour Facebook Graph API
    reddit: 10000,    // 10s pour Reddit API
    sentiment: 30000, // 30s pour Claude/OpenAI
    email: 20000      // 20s pour SMTP
  };

  return timeouts[apiType] || 10000;
}

/**
 * Helper pour construire les URLs d'API avec paramètres
 */
export function buildAPIUrl(endpoint: string, params?: Record<string, string | number>): string {
  const url = new URL(endpoint, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value.toString());
    });
  }

  return url.toString();
}

/**
 * Hook pour debounce des appels API (éviter les spam)
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

import { useState, useEffect } from 'react';
