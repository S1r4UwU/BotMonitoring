'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface BudgetStats {
  usageStats: {
    monthlyUsage: number;
    maxBudget: number;
    usagePercent: number;
    remainingBudget: number;
    resetDate: Date;
    canUseAI: boolean;
  };
}

export function BudgetMonitor() {
  const [budgetData, setBudgetData] = useState<BudgetStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBudgetStats = async () => {
    try {
      const response = await fetch('/api/sentiment/analyze');
      if (response.ok) {
        const data = await response.json();
        setBudgetData(data);
      }
    } catch (error) {
      console.error('Erreur récupération budget IA:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetStats();
    
    // Refresh toutes les 10 minutes
    const interval = setInterval(fetchBudgetStats, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-5 bg-gray-300 rounded w-2/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-8 bg-gray-300 rounded w-1/3"></div>
            <div className="h-4 bg-gray-300 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!budgetData) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-gray-500">
            <DollarSign className="h-8 w-8 mx-auto mb-2" />
            <p>Budget IA non disponible</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { usageStats } = budgetData;
  const usageBudgetEuros = usageStats.monthlyUsage / 100;
  const maxBudgetEuros = usageStats.maxBudget / 100;
  const remainingEuros = usageStats.remainingBudget / 100;

  const getBudgetStatus = () => {
    if (usageStats.usagePercent < 50) {
      return { color: 'text-green-600', icon: CheckCircle, label: 'Budget OK' };
    } else if (usageStats.usagePercent < 80) {
      return { color: 'text-yellow-600', icon: TrendingUp, label: 'Attention' };
    } else {
      return { color: 'text-red-600', icon: AlertTriangle, label: 'Budget épuisé' };
    }
  };

  const status = getBudgetStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <DollarSign className="h-5 w-5 mr-2 text-green-600" />
          Budget IA
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status principal */}
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900">
            {usageBudgetEuros.toFixed(2)}€
          </div>
          <div className="text-sm text-gray-600">
            utilisé sur {maxBudgetEuros}€
          </div>
          <Badge 
            className={`mt-2 ${status.color}`}
            variant="secondary"
          >
            <status.icon className="h-3 w-3 mr-1" />
            {status.label}
          </Badge>
        </div>

        {/* Barre de progression */}
        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Usage mensuel</span>
            <span>{usageStats.usagePercent.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                usageStats.usagePercent < 50 
                  ? 'bg-green-500' 
                  : usageStats.usagePercent < 80 
                  ? 'bg-yellow-500' 
                  : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(usageStats.usagePercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Détails */}
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Restant ce mois :</span>
            <span className="font-medium">{remainingEuros.toFixed(2)}€</span>
          </div>
          <div className="flex justify-between">
            <span>Reset le :</span>
            <span>{new Date(usageStats.resetDate).toLocaleDateString('fr-FR')}</span>
          </div>
        </div>

        {/* Alertes budget */}
        {usageStats.usagePercent > 80 && (
          <Alert variant={usageStats.usagePercent > 90 ? 'destructive' : 'default'}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {usageStats.usagePercent > 90 ? (
                <strong>Budget IA presque épuisé !</strong>
              ) : (
                <strong>Attention au budget IA</strong>
              )}
              {' '}L&apos;analyse basique (lexique) reste disponible.
            </AlertDescription>
          </Alert>
        )}

        {!usageStats.canUseAI && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Budget IA épuisé</strong> - Seule l&apos;analyse lexique est disponible jusqu&apos;au reset mensuel.
            </AlertDescription>
          </Alert>
        )}

        {/* Estimation des coûts */}
        <div className="pt-3 border-t text-xs text-gray-500">
          <p>💡 <strong>Estimation :</strong></p>
          <p>• Analyse lexique : gratuite</p>
          <p>• Claude 3.5 Sonnet : ~0,05€ par analyse</p>
          <p>• Seulement pour cas critiques (sentiment ≤ -3)</p>
        </div>
      </CardContent>
    </Card>
  );
}
