'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function RedditDebugPage() {
  type JsonLike = Record<string, unknown> | Array<unknown> | string | number | boolean | null;
  const [debugResults, setDebugResults] = useState<JsonLike>({});
  const [isDebugging, setIsDebugging] = useState(false);

  const runCompleteDebug = async () => {
    setIsDebugging(true);
    const results: Record<string, unknown> = {};
    try {
      results.envCheck = await fetch('/api/debug/reddit-env').then(r => r.json());
      results.authCheck = await fetch('/api/debug/reddit-auth').then(r => r.json());
      results.directSearch = await fetch('/api/debug/reddit-search?q=pizza').then(r => r.json());
      const keywords = ['cat','dog','news','funny','pizza','food'];
      results.keywordTests = {};
      for (const k of keywords) {
        (results.keywordTests as Record<string, unknown>)[k] = await fetch(`/api/debug/reddit-search?q=${encodeURIComponent(k)}&limit=5`).then(r => r.json());
      }
      results.languageFilter = await fetch('/api/debug/language-filter').then(r => r.json());
    } catch (e: unknown) {
      results.error = e instanceof Error ? e.message : 'unknown';
    } finally {
      setDebugResults(results);
      setIsDebugging(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Debug Reddit API</h1>
        <Button onClick={runCompleteDebug} disabled={isDebugging}>
          {isDebugging ? '🔍 Diagnostic en cours...' : '🔍 Lancer diagnostic complet'}
        </Button>
      </div>

      {Object.keys(debugResults).length > 0 && (
        <div className="space-y-4">
          <DebugCard title="1. Variables d'environnement" data={debugResults.envCheck} />
          <DebugCard title="2. Authentification Reddit" data={debugResults.authCheck} />
          <DebugCard title="3. Recherche directe" data={debugResults.directSearch} />
          <DebugCard title="4. Tests mots-clés populaires" data={debugResults.keywordTests} />
          <DebugCard title="5. Filtrage de langue" data={debugResults.languageFilter} />
        </div>
      )}
    </div>
  );
}

function DebugCard({ title, data }: { title: string; data: unknown }) {
  return (
    <Card className="p-4">
      <h3 className="font-medium mb-2">{title}</h3>
      <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-96">{JSON.stringify(data, null, 2)}</pre>
    </Card>
  );
}


