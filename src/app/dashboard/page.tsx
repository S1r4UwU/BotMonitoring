import { Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DashboardContent } from '@/components/dashboard/dashboard-content';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* En-tête de la page */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Vue d&apos;ensemble de vos activités de monitoring
        </p>
      </div>

      {/* Bannière d'information contextuelle */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertDescription className="text-blue-800">
          {process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ? (
            <>
              <strong>Mode démo actif:</strong> Toutes les données sont simulées. 
              Configurez vos clés API dans les paramètres pour activer le monitoring réel.
            </>
          ) : (
            <>
              <strong>Monitoring actif:</strong> Surveillance des réseaux sociaux en cours. 
              Configurez vos mots-clés dans la section Monitoring pour optimiser la détection.
            </>
          )}
        </AlertDescription>
      </Alert>

      {/* Contenu principal avec Suspense pour le chargement */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Skeleton pour les cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-8 bg-gray-300 rounded w-1/2"></div>
                <div className="h-3 bg-gray-300 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Skeleton pour la grille de contenu */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Skeleton pour le tableau des mentions */}
        <div className="lg:col-span-2">
          <Card className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-6 bg-gray-300 rounded w-1/3"></div>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="h-4 bg-gray-300 rounded w-8"></div>
                    <div className="h-4 bg-gray-300 rounded flex-1"></div>
                    <div className="h-4 bg-gray-300 rounded w-20"></div>
                    <div className="h-4 bg-gray-300 rounded w-16"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Skeleton pour les stats secondaires */}
        <div className="space-y-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-5 bg-gray-300 rounded w-2/3"></div>
                  <div className="h-8 bg-gray-300 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
