// Middleware simplifié - Redirection directe vers dashboard
import { type NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // Redirection automatique de la page d'accueil vers le dashboard
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Laisser passer toutes les autres routes
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
