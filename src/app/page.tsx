'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Shield, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  Loader2,
  Play,
  Info
} from 'lucide-react';
// import { isDemoMode } from '@/services/demo-data';

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginMode, setLoginMode] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  });
  
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Vérifier s'il y a une session démo dans localStorage
        const demoSession = localStorage.getItem('socialguard-demo-session');
        if (demoSession) {
          router.push('/dashboard');
          return;
        }

        // Essayer Supabase seulement si configuré
        try {
          const supabase = createClientComponentClient();
          const { data: { user }, error } = await supabase.auth.getUser();
          
          if (!error && user) {
            router.push('/dashboard');
            return;
          }
        } catch {
          console.log('Supabase non configuré ou erreur - mode standalone');
        }

        // aucune session
      } catch {
        console.error('Erreur:');
        // aucune session
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError('');

    try {
      // Essayer Supabase s'il est configuré
      try {
        const supabase = createClientComponentClient();
        
        if (loginMode === 'signup') {
          const { data, error } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
              data: {
                full_name: formData.fullName,
              },
            },
          });

          if (error) {
            setError(error.message);
            return;
          }

          if (data.user) {
            setError('');
            alert('Compte créé ! Vérifiez votre email pour activer votre compte.');
            setLoginMode('login');
          }
        } else {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          });

          if (error) {
            setError(error.message);
            return;
          }

          if (data.user) {
            router.push('/dashboard');
          }
        }
      } catch {
        // Si Supabase non configuré, connexion locale simulée
        console.log('Supabase non configuré, connexion locale simulée');
        
        if (formData.email && formData.password) {
          localStorage.setItem('socialguard-demo-session', JSON.stringify({
            email: formData.email,
            fullName: formData.fullName || 'Utilisateur',
            loginTime: new Date().toISOString()
          }));
          router.push('/dashboard');
        } else {
          setError('Veuillez remplir tous les champs');
        }
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setAuthLoading(true);
    setError('');

    try {
      const supabase = createClientComponentClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        setError(error.message);
      }
    } catch {
      console.log('OAuth Google non configuré, connexion locale simulée');
      // Simuler une connexion Google
      localStorage.setItem('socialguard-demo-session', JSON.stringify({
        email: 'user@google.com',
        fullName: 'Utilisateur Google',
        loginTime: new Date().toISOString(),
        provider: 'google'
      }));
      router.push('/dashboard');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDemoAccess = () => {
    // Créer une session démo et rediriger
    localStorage.setItem('socialguard-demo-session', JSON.stringify({
      email: 'demo@socialguard.dev',
      fullName: 'Utilisateur Démo',
      loginTime: new Date().toISOString(),
      provider: 'demo'
    }));
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-semibold text-gray-700">SocialGuard</h2>
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Shield className="h-10 w-10 text-blue-600" />
            <span className="text-3xl font-bold text-gray-900">SocialGuard</span>
          </div>
          <p className="text-gray-600">
            Monitoring et réponse automatique pour réseaux sociaux
          </p>
        </div>

        {/* Notice application */}
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Application SocialGuard</strong> - Cliquez &quot;Accès démo&quot; pour tester immédiatement ou connectez-vous avec vos identifiants.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              {loginMode === 'login' ? 'Connexion' : 'Créer un compte'}
            </CardTitle>
            <CardDescription>
              {loginMode === 'login' 
                ? 'Accédez à votre dashboard de monitoring' 
                : 'Démarrez votre monitoring des réseaux sociaux'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Accès démo en premier */}
            <Button
              onClick={handleDemoAccess}
              variant="outline"
              className="w-full border-2 border-orange-500 text-orange-700 hover:bg-orange-50"
              size="lg"
            >
              <Play className="mr-2 h-4 w-4" />
              Accès démo (essayer immédiatement)
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Ou</span>
              </div>
            </div>

            {/* Google OAuth */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleAuth}
              disabled={authLoading}
              className="w-full"
              size="lg"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continuer avec Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Ou par e-mail</span>
              </div>
            </div>

            {/* Form d'authentification */}
            <form onSubmit={handleAuth} className="space-y-4">
              {loginMode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nom complet</Label>
                  <div className="relative">
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={handleFormChange}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Adresse email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    placeholder="votre@email.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleFormChange}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={authLoading}
              >
                {authLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {loginMode === 'login' ? 'Connexion...' : 'Création...'}
                  </>
                ) : (
                  loginMode === 'login' ? 'Se connecter' : 'Créer le compte'
                )}
              </Button>
            </form>

            <div className="text-center text-sm text-gray-600">
              {loginMode === 'login' ? (
                <>
                  Pas encore de compte ?{' '}
                  <button
                    onClick={() => setLoginMode('signup')}
                    className="text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Créer un compte
                  </button>
                </>
              ) : (
                <>
                  Déjà un compte ?{' '}
                  <button
                    onClick={() => setLoginMode('login')}
                    className="text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Se connecter
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer minimal */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>SocialGuard • Monitoring des réseaux sociaux</p>
        </div>
      </div>
    </div>
  );
}