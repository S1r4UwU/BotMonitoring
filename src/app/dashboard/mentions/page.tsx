import { Suspense } from 'react';
import { MentionsTable } from '@/components/dashboard/mentions-table';
import { Card, CardContent } from '@/components/ui/card';

export default function MentionsPage() {
  return (
    <div className="space-y-6">
      {/* En-tête de la page */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mentions</h1>
        <p className="text-gray-600">
          Gérez et surveillez toutes vos mentions sur les réseaux sociaux
        </p>
      </div>

      {/* Tableau des mentions avec toutes les fonctionnalités */}
      <Suspense fallback={<MentionsTableSkeleton />}>
        <MentionsTable 
          showFilters={true} 
          autoRefresh={true}
        />
      </Suspense>
    </div>
  );
}

function MentionsTableSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="h-6 bg-gray-300 rounded w-1/3"></div>
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="h-4 bg-gray-300 rounded w-8"></div>
              <div className="h-4 bg-gray-300 rounded flex-1"></div>
              <div className="h-4 bg-gray-300 rounded w-20"></div>
              <div className="h-4 bg-gray-300 rounded w-16"></div>
              <div className="h-4 bg-gray-300 rounded w-24"></div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
