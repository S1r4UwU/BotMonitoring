'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mail,
  Send,
  CheckCircle,
  XCircle,
  Loader2,
  Info
} from 'lucide-react';

export function EmailTest() {
  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    emailId?: string;
  } | null>(null);

  const handleTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!testEmail) {
      setResult({
        success: false,
        message: 'Veuillez saisir une adresse email'
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/monitoring/test-apis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ testEmail })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data.email);

    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur de connexion'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Mail className="h-5 w-5 mr-2 text-blue-600" />
          Test du Service Email
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Resend API</strong> - Service email moderne avec 3000 emails/mois gratuits et excellent taux de délivrabilité.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleTestEmail} className="space-y-4">
          <div>
            <Label htmlFor="testEmail">Adresse email de test</Label>
            <Input
              id="testEmail"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="votre@email.com"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Un email de test sera envoyé à cette adresse pour vérifier la configuration
            </p>
          </div>

          <Button 
            type="submit" 
            disabled={loading || !testEmail}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Envoyer un email de test
              </>
            )}
          </Button>
        </form>

        {/* Résultat du test */}
        {result && (
          <Alert variant={result.success ? 'default' : 'destructive'}>
            {result.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              <div>
                <strong>{result.success ? 'Succès' : 'Erreur'} :</strong> {result.message}
              </div>
              {result.emailId && (
                <div className="text-xs text-gray-600 mt-1">
                  ID Email Resend: {result.emailId}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Informations Resend */}
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Configuration requise :</strong></p>
          <ul className="ml-4 space-y-1">
            <li>• RESEND_API_KEY dans .env.local</li>
            <li>• Domaine vérifié sur resend.com (optionnel)</li>
            <li>• Limite : 3000 emails/mois gratuits</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
