import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmailTest } from '@/components/settings/email-test';
import Link from 'next/link';
import { 
  Settings, 
  User, 
  Key, 
  Bell,
  Shield,
  Zap,
  ExternalLink,
  Mail
} from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* En-tête de la page */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-600">
          Configurez votre compte et vos intégrations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Paramètres principaux */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profil utilisateur */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Profil utilisateur
              </CardTitle>
              <CardDescription>
                Gérez vos informations personnelles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Nom complet</Label>
                  <Input id="fullName" placeholder="John Doe" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="john@exemple.com" />
                </div>
              </div>
              <div>
                <Label htmlFor="company">Entreprise</Label>
                <Input id="company" placeholder="Mon Entreprise" />
              </div>
              <Button>Sauvegarder</Button>
            </CardContent>
          </Card>

          {/* Intégrations APIs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="h-5 w-5 mr-2" />
                Intégrations APIs
              </CardTitle>
              <CardDescription>
                Configurez vos accès aux réseaux sociaux (budget free tier)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Facebook */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📘</span>
                  <div>
                    <h3 className="font-medium">Facebook</h3>
                    <p className="text-sm text-gray-600">Non configuré</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/settings/apis">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Configurer
                  </Link>
                </Button>
              </div>

              {/* Instagram */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📷</span>
                  <div>
                    <h3 className="font-medium">Instagram</h3>
                    <p className="text-sm text-gray-600">Non configuré</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/settings/apis">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Configurer
                  </Link>
                </Button>
              </div>

              {/* Reddit */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🤖</span>
                  <div>
                    <h3 className="font-medium">Reddit</h3>
                    <p className="text-sm text-gray-600">Non configuré</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/settings/apis">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Configurer
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Test du Service Email */}
          <EmailTest />
        </div>

        {/* Panneau latéral */}
        <div className="space-y-6">
          {/* Budget et utilisation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                Budget & Utilisation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm">
                  <span>Mentions ce mois</span>
                  <span>0 / 5000</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm">
                  <span>Emails envoyés</span>
                  <span>0 / 3000</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm">
                  <span>Budget IA utilisé</span>
                  <span>0€ / 10€</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>

              <div className="pt-2 border-t text-sm text-gray-600">
                <p>Plan: <strong>Free Tier</strong></p>
                <p>Coût estimé: <strong>0€/mois</strong></p>
              </div>
            </CardContent>
          </Card>

          {/* Sécurité */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Sécurité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Authentification 2FA</span>
                <span className="text-gray-500">Bientôt disponible</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span>Sessions actives</span>
                <Button variant="link" size="sm" className="p-0 h-auto">
                  Gérer
                </Button>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span>Historique des connexions</span>
                <Button variant="link" size="sm" className="p-0 h-auto">
                  Voir
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Support */}
          <Card>
            <CardHeader>
              <CardTitle>Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <Button variant="link" size="sm" className="p-0 h-auto">
                  📚 Documentation
                </Button>
              </div>
              <div>
                <Button variant="link" size="sm" className="p-0 h-auto">
                  💬 Support technique
                </Button>
              </div>
              <div>
                <Button variant="link" size="sm" className="p-0 h-auto">
                  🐛 Signaler un bug
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
