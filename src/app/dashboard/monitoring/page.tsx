import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { APIStatus } from '@/components/monitoring/api-status';
import { RealTimeScanner } from '@/components/monitoring/real-time-scanner';
import { BudgetMonitor } from '@/components/monitoring/budget-monitor';
import { Button } from '@/components/ui/button';
import { Settings, BarChart3, Plus } from 'lucide-react';

export default function MonitoringPage() {
  return (
    <div className="space-y-8">
      {/* En-tête de la page */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monitoring Avancé</h1>
          <p className="text-gray-600">
            Configuration et surveillance des APIs de réseaux sociaux
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau cas
          </Button>
        </div>
      </div>

      {/* Bannière d'information */}
      <Alert className="border-blue-200 bg-blue-50">
        <BarChart3 className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Monitoring actif</strong> - Cette page vous permet de surveiller et contrôler 
          vos intégrations de réseaux sociaux en temps réel avec un budget ma&icirc;tris&eacute;.
        </AlertDescription>
      </Alert>

      {/* Grille principale des outils de monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Scanner temps réel */}
        <RealTimeScanner />

        {/* Status des APIs */}
        <APIStatus />

        {/* Budget IA */}
        <BudgetMonitor />
      </div>

      {/* Section configuration des cas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuration des mots-clés */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration des mots-clés</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="border-amber-200 bg-amber-50">
              <AlertDescription className="text-amber-800">
                <strong>Prochainement :</strong> Interface de configuration des mots-clés 
                et plateformes à surveiller par cas.
              </AlertDescription>
            </Alert>
            <div className="mt-4 text-sm text-gray-600">
              <p><strong>Fonctionnalités prévues :</strong></p>
              <ul className="mt-2 space-y-1 ml-4">
                <li>• Ajout/suppression de mots-clés</li>
                <li>• Configuration des plateformes</li>
                <li>• Intervalles de surveillance</li>
                <li>• Seuils d&apos;alerte personnalisés</li>
                <li>• Exclusion de mots parasites</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Historique et logs */}
        <Card>
          <CardHeader>
            <CardTitle>Historique des scans</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="border-amber-200 bg-amber-50">
              <AlertDescription className="text-amber-800">
                <strong>Prochainement :</strong> Historique détaillé des scans 
                et logs de monitoring avec métriques de performance.
              </AlertDescription>
            </Alert>
            <div className="mt-4 text-sm text-gray-600">
              <p><strong>Fonctionnalités prévues :</strong></p>
              <ul className="mt-2 space-y-1 ml-4">
                <li>• Logs détaillés par plateforme</li>
                <li>• Métriques de rate limiting</li>
                <li>• Historique des erreurs</li>
                <li>• Statistiques de performance</li>
                <li>• Export des données</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section guides rapides */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Guides de configuration
            </h3>
            <p className="text-gray-600 mt-1">
              Configurez vos APIs pour commencer le monitoring réel
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" size="sm">
              📘 Guide Facebook
            </Button>
            <Button variant="outline" size="sm">
              🤖 Guide Reddit
            </Button>
            <Button variant="outline" size="sm">
              📧 Guide Email
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
