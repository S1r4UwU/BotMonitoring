'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardMetrics } from '@/models/types';
import { 
  MessageCircle, 
  TrendingUp, 
  AlertTriangle, 
  FileText,
  BarChart3,
  Clock
} from 'lucide-react';

interface StatsCardsProps {
  stats: DashboardMetrics;
  loading?: boolean;
}

export function StatsCards({ stats, loading = false }: StatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-300 rounded w-20"></div>
              <div className="h-4 w-4 bg-gray-300 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-300 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Mentions',
      value: stats.total_mentions.toLocaleString(),
      change: `+${stats.new_mentions} nouvelles`,
      changeType: stats.new_mentions > 0 ? 'positive' : 'neutral',
      icon: MessageCircle,
      color: 'text-blue-600',
    },
    {
      title: 'Sentiment Négatif',
      value: `${Math.round((stats.sentiment_distribution.negative / (stats.total_mentions || 1)) * 100)}%`,
      change: `${stats.sentiment_distribution.negative} mentions`,
      changeType: stats.sentiment_distribution.negative > 0 ? 'negative' : 'positive',
      icon: TrendingUp,
      color: 'text-red-600',
    },
    {
      title: 'Cas Actifs',
      value: stats.active_cases.toString(),
      change: 'En surveillance',
      changeType: 'neutral',
      icon: FileText,
      color: 'text-green-600',
    },
    {
      title: 'Alertes Critiques',
      value: stats.critical_alerts.toString(),
      change: 'À traiter',
      changeType: stats.critical_alerts > 0 ? 'negative' : 'positive',
      icon: AlertTriangle,
      color: stats.critical_alerts > 0 ? 'text-red-600' : 'text-gray-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {card.value}
            </div>
            <div className="flex items-center mt-2">
              <Badge
                variant={
                  card.changeType === 'positive' 
                    ? 'default' 
                    : card.changeType === 'negative' 
                    ? 'destructive' 
                    : 'secondary'
                }
                className="text-xs"
              >
                {card.change}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface PlatformStatsProps {
  platformData: Record<string, number>;
  loading?: boolean;
}

export function PlatformStats({ platformData, loading = false }: PlatformStatsProps) {
  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-4 bg-gray-300 rounded w-32"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-3 bg-gray-300 rounded w-20"></div>
                <div className="h-3 bg-gray-300 rounded w-12"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const platforms = Object.entries(platformData);
  const total = Object.values(platformData).reduce((sum, count) => sum + count, 0);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return '📘';
      case 'instagram':
        return '📷';
      case 'reddit':
        return '🤖';
      default:
        return '🌐';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return 'bg-blue-100 text-blue-800';
      case 'instagram':
        return 'bg-pink-100 text-pink-800';
      case 'reddit':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">
          Mentions par plateforme
        </CardTitle>
        <BarChart3 className="h-5 w-5 text-gray-500" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {platforms.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Aucune mention pour le moment
            </p>
          ) : (
            platforms.map(([platform, count]) => {
              const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={platform} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">
                      {getPlatformIcon(platform)}
                    </span>
                    <span className="font-medium capitalize">
                      {platform}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant="secondary"
                      className={getPlatformColor(platform)}
                    >
                      {count} ({percentage}%)
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ResponseStatsProps {
  responseRate: number;
  avgResponseTime: number;
  loading?: boolean;
}

export function ResponseStats({ 
  responseRate, 
  avgResponseTime, 
  loading = false 
}: ResponseStatsProps) {
  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-4 bg-gray-300 rounded w-32"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-8 bg-gray-300 rounded w-20"></div>
            <div className="h-8 bg-gray-300 rounded w-24"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">
          Performance des réponses
        </CardTitle>
        <Clock className="h-5 w-5 text-gray-500" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(responseRate)}%
            </div>
            <p className="text-sm text-gray-600">Taux de réponse</p>
          </div>
          
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {avgResponseTime > 0 ? `${avgResponseTime}min` : 'N/A'}
            </div>
            <p className="text-sm text-gray-600">Temps moyen de réponse</p>
          </div>

          {/* Barre de progression pour le taux de réponse */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Objectif: 80%</span>
              <span>{Math.round(responseRate)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  responseRate >= 80 
                    ? 'bg-green-600' 
                    : responseRate >= 60 
                    ? 'bg-yellow-600' 
                    : 'bg-red-600'
                }`}
                style={{ width: `${Math.min(responseRate, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
