import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';

export default function ResponsesPage() {
  return (
    <div className="space-y-6">
      {/* En-tête de la page */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Réponses</h1>
        <p className="text-gray-600">
          Gérez vos réponses automatiques et semi-automatiques
        </p>
      </div>

      {/* Bannière d'information */}
      <Alert className="border-amber-200 bg-amber-50">
        <AlertDescription className="text-amber-800">
          <strong>En développement:</strong> Le système de réponses automatiques sera disponible prochainement.
          Cette fonctionnalité utilisera l'IA de manière frugale pour générer des réponses pertinentes.
        </AlertDescription>
      </Alert>

      {/* État vide */}
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Système de réponses en préparation
            </h3>
            <p className="text-gray-600 mb-4">
              Cette section permettra de gérer vos réponses automatiques, templates et historique des interactions.
            </p>
            <div className="text-sm text-gray-500">
              <p>Fonctionnalités à venir :</p>
              <ul className="mt-2 space-y-1">
                <li>• Génération IA de réponses (usage frugal)</li>
                <li>• Templates de réponses personnalisables</li>
                <li>• Validation humaine des réponses automatiques</li>
                <li>• Historique et métriques de performance</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
