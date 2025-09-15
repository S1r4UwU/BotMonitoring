'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Eye,
  MessageCircle,
  CheckCircle,
  AlertTriangle,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Mention } from '@/models/types';
import { useMentions } from '@/hooks/useMentions';
import { useDemoMentions } from '@/hooks/useDemoMentions';
import { isDemoMode } from '@/services/demo-data';

interface MentionsTableProps {
  showFilters?: boolean;
  maxItems?: number;
  autoRefresh?: boolean;
}

export function MentionsTable({ 
  showFilters = true, 
  maxItems,
  autoRefresh = true 
}: MentionsTableProps) {
  const [filters, setFilters] = useState({});
  
  // TOUJOURS utiliser les vraies données maintenant
  const {
    mentions,
    loading,
    error,
    totalCount,
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    fetchMentions,
    refreshMentions,
    updateMentionStatus,
  } = useMentions({
    filters,
    pageSize: maxItems || 20,
    autoRefresh,
  });

  const getSentimentBadge = (score: number | null) => {
    if (score === null) return <Badge variant="secondary">N/A</Badge>;
    
    if (score > 1) {
      return <Badge className="bg-green-100 text-green-800">Positif ({score})</Badge>;
    } else if (score < -1) {
      return <Badge variant="destructive">Négatif ({score})</Badge>;
    } else {
      return <Badge variant="secondary">Neutre ({score})</Badge>;
    }
  };

  const getStatusBadge = (status: Mention['status']) => {
    const statusConfig = {
      new: { variant: 'default', label: 'Nouveau' },
      processed: { variant: 'secondary', label: 'Traité' },
      responded: { variant: 'outline', label: 'Répondu' },
      ignored: { variant: 'secondary', label: 'Ignoré' },
    } as const;

    const config = statusConfig[status];
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return '📘';
      case 'instagram': return '📷';
      case 'reddit': return '🤖';
      default: return '🌐';
    }
  };

  const getUrgencyColor = (urgency: number) => {
    if (urgency >= 8) return 'text-red-600';
    if (urgency >= 6) return 'text-yellow-600';
    return 'text-green-600';
  };

  const handleStatusUpdate = async (id: string, status: Mention['status']) => {
    try {
      await updateMentionStatus(id, status);
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
    }
  };

  const truncateContent = (content: string, maxLength = 100) => {
    return content.length > maxLength 
      ? content.substring(0, maxLength) + '...' 
      : content;
  };

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-red-600">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Erreur lors du chargement des mentions: {error}</p>
            <Button 
              variant="outline" 
              onClick={refreshMentions}
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Mentions récentes
          </CardTitle>
          <div className="flex items-center space-x-2">
            {showFilters && (
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtres
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshMentions}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading && mentions.length === 0 ? (
          <div className="animate-pulse">
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 py-2">
                  <div className="h-4 w-4 bg-gray-300 rounded"></div>
                  <div className="h-4 bg-gray-300 rounded flex-1"></div>
                  <div className="h-4 w-16 bg-gray-300 rounded"></div>
                  <div className="h-4 w-20 bg-gray-300 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        ) : mentions.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucune mention trouvée</p>
            <p className="text-sm text-gray-500">
              Les mentions apparaîtront ici une fois la surveillance configurée
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plateforme</TableHead>
                    <TableHead>Contenu</TableHead>
                    <TableHead>Auteur</TableHead>
                    <TableHead>Sentiment</TableHead>
                    <TableHead>Urgence</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mentions.map((mention) => (
                    <TableRow key={mention.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span>{getPlatformIcon(mention.platform)}</span>
                          <span className="capitalize text-sm">
                            {mention.platform}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="max-w-xs">
                        <div className="truncate">
                          {truncateContent(mention.content)}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {mention.author_name || 'Anonyme'}
                          </div>
                          {mention.author_handle && (
                            <div className="text-gray-500">
                              @{mention.author_handle}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {getSentimentBadge(mention.sentiment_score)}
                      </TableCell>
                      
                      <TableCell>
                        <span className={`font-semibold ${getUrgencyColor(mention.urgency_score)}`}>
                          {mention.urgency_score}/10
                        </span>
                      </TableCell>
                      
                      <TableCell className="text-sm text-gray-600">
                        {formatDistanceToNow(new Date(mention.published_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </TableCell>
                      
                      <TableCell>
                        {getStatusBadge(mention.status)}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Voir détail"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Répondre"
                            disabled={mention.status === 'responded'}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Marquer comme traité"
                            onClick={() => handleStatusUpdate(mention.id, 'processed')}
                            disabled={mention.status === 'processed'}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
            {!maxItems && totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  {totalCount} mention{totalCount > 1 ? 's' : ''} au total
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchMentions(currentPage - 1)}
                    disabled={!hasPrevPage || loading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </Button>
                  
                  <span className="text-sm text-gray-600">
                    Page {currentPage} sur {totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchMentions(currentPage + 1)}
                    disabled={!hasNextPage || loading}
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
