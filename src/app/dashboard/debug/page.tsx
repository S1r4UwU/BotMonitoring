'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function DebugPage() {
  type JsonValue = Record<string, unknown> | Array<unknown> | string | number | boolean | null;
  const [diagnostics, setDiagnostics] = useState<JsonValue | null>(null);
  const [apiTests, setApiTests] = useState<JsonValue | null>(null);
  const [macronTest, setMacronTest] = useState<JsonValue | null>(null);
  const [loading, setLoading] = useState<string>('');

  const runFullDiagnostic = async () => {
    setLoading('diagnostic');
    try {
      const response = await fetch('/api/debug/full-diagnostic');
      const data = await response.json();
      setDiagnostics(data);
    } catch (error) {
      console.error('Erreur diagnostic:', error);
    } finally {
      setLoading('');
    }
  };

  const testAllAPIs = async () => {
    setLoading('apis');
    try {
      const response = await fetch('/api/debug/test-all-apis', { method: 'POST' });
      const data = await response.json();
      setApiTests(data);
    } catch (error) {
      console.error('Erreur test APIs:', error);
    } finally {
      setLoading('');
    }
  };

  const testMacronCase = async () => {
    setLoading('macron');
    try {
      const response = await fetch('/api/debug/test-macron-case', { method: 'POST' });
      const data = await response.json();
      setMacronTest(data);
    } catch (error) {
      console.error('Erreur test Macron:', error);
    } finally {
      setLoading('');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">🧪 Debug SocialGuard</h1>

      <div className="flex gap-4">
        <Button onClick={runFullDiagnostic} disabled={loading === 'diagnostic'}>
          {loading === 'diagnostic' ? '🔄 Test...' : '🔍 Diagnostic Complet'}
        </Button>
        <Button onClick={testAllAPIs} disabled={loading === 'apis'}>
          {loading === 'apis' ? '🔄 Test...' : '🌐 Tester Toutes les APIs'}
        </Button>
        <Button onClick={testMacronCase} disabled={loading === 'macron'} className="bg-blue-600 hover:bg-blue-700">
          {loading === 'macron' ? '🔄 Test...' : '🇫🇷 Test Cas Emmanuel Macron'}
        </Button>
      </div>

      {diagnostics && (
        <Card className="p-6">
          <h3 className="font-medium mb-4">📊 Diagnostic Système</h3>
          <pre className="bg-muted p-4 rounded text-sm overflow-auto">
            {JSON.stringify(diagnostics, null, 2)}
          </pre>
        </Card>
      )}

      {apiTests && (
        <Card className="p-6">
          <h3 className="font-medium mb-4">🌐 Tests APIs</h3>
          <pre className="bg-muted p-4 rounded text-sm overflow-auto">
            {JSON.stringify(apiTests, null, 2)}
          </pre>
        </Card>
      )}

      {macronTest && (
        <Card className="p-6">
          <h3 className="font-medium mb-4">🇫🇷 Test Cas Emmanuel Macron</h3>
          <pre className="bg-muted p-4 rounded text-sm overflow-auto">
            {JSON.stringify(macronTest, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}


