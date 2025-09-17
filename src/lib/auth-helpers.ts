'use server';

import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export interface AuthContext {
  userId?: string;
  email?: string;
  roles?: string[];
  raw?: any;
}

export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token.trim();
}

export function verifyBearerJwt(token: string): AuthContext | null {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || '';
  if (!secret) {
    console.warn('JWT_SECRET manquant - sécurité compromise');
    return null;
  }
  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
      maxAge: '24h'
    } as any);
    const payload = typeof decoded === 'string' ? { sub: decoded } : decoded;
    return {
      userId: (payload as any).sub || (payload as any).userId,
      email: (payload as any).email,
      roles: (payload as any).roles || [],
      raw: payload,
    };
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

export function requireAuthRoute(request: NextRequest): AuthContext {
  if (isDemoMode()) {
    return { userId: 'demo-user', roles: ['demo'], raw: null };
  }
  const token = extractBearerToken(request);
  if (!token) {
    throw new Error('Unauthorized');
  }
  const ctx = verifyBearerJwt(token);
  if (!ctx) {
    throw new Error('Unauthorized');
  }
  return ctx;
}


