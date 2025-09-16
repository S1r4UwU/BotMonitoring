'use client';

import { isDemoMode } from '@/services/demo-data';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Play } from 'lucide-react';

export function DemoWatermark() {
  if (!isDemoMode()) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <Alert className="m-2 border-orange-200 bg-orange-50/95 backdrop-blur-sm">
        <Info className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800 flex items-center justify-between">
          <div className="flex items-center">
            <Play className="h-4 w-4 mr-2" />
            <strong>Mode démo actif</strong> - Les données sont simulées et aucune modification réelle n&apos;est sauvegardée
          </div>
          <div className="text-xs opacity-75">
            Configurez Supabase pour utiliser de vraies données
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
