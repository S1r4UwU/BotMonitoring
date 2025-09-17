// Middleware simplifié - Redirection directe vers dashboard
import { type NextRequest, NextResponse } from 'next/server';
import { extractBearerToken, verifyBearerJwt, isDemoMode } from '@/lib/auth-helpers';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Redirection automatique de la page d'accueil vers le dashboard
  if (path === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Protection basique des routes API
  if (path.startsWith('/api/')) {
    if (!isDemoMode()) {
      const token = extractBearerToken(request);
      const auth = token ? verifyBearerJwt(token) : null;
      if (!auth) {
        return new NextResponse('Unauthorized', { status: 401 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match toutes les routes sauf les API, _next/static, _next/image, favicon.ico
     * et les fichiers statiques
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
