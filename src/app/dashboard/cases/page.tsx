'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreateCaseForm } from '@/components/cases/create-case-form';
import { Plus, FileText, Eye, Edit, Trash2, Play, Pause, X } from 'lucide-react';

interface Case {
  id: string;
  name: string;
  description?: string;
  keywords: string;
  platforms: string;
  status: 'active' | 'paused' | 'archived';
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

export default function CasesPage() {
  const router = useRouter();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchCases = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('[DEBUG] Fetching cases...');
      
      const response = await fetch('/api/cases');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      setCases(result.data);
      console.log(`[INFO] ${result.data.length} cas récupérés`);

    } catch (err) {
      console.error('[ERROR] Fetch cases:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleCreateSuccess = (caseData: { id: string; name: string }) => {
    console.log('[INFO] Cas créé avec succès:', caseData);
    setShowCreateForm(false);
    fetchCases(); // Recharger la liste
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: 'default', label: 'Actif' },
      paused: { variant: 'secondary', label: 'En pause' },
      archived: { variant: 'outline', label: 'Archivé' }
    } as const;

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return <Badge variant={config.variant as 'default' | 'secondary' | 'outline'}>{config.label}</Badge>;
  };

  const parseArrayField = (field: string) => {
    try {
      return JSON.parse(field);
    } catch {
      return [];
    }
  };

  const handleViewCase = (cas: Case) => {
    console.log('[DEBUG] Voir cas:', cas.id);
    router.push(`/dashboard/cases/${cas.id}`);
  };

  const handleEditCase = (cas: Case) => {
    console.log('[DEBUG] Modifier cas:', cas.id);
    // TODO: Ouvrir formulaire d'édition
    alert(`Modification du cas "${cas.name}" - Fonctionnalité en développement`);
  };

  const handleToggleStatus = async (cas: Case) => {
    try {
      setActionLoading(cas.id);
      console.log('[DEBUG] Basculer statut cas:', cas.id);
      
      const newStatus = cas.status === 'active' ? 'paused' : 'active';
      
      const response = await fetch(`/api/cases/${cas.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erreur mise à jour statut');
      }

      // Mettre à jour l'état local
      setCases(prev => prev.map(c => 
        c.id === cas.id ? { ...c, status: newStatus } : c
      ));
      
      console.log('[INFO] Statut cas mis à jour:', cas.id, '->', newStatus);
      
    } catch (error) {
      console.error('[ERROR] Erreur toggle status:', error);
      alert('Erreur lors de la mise à jour du statut: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCase = async (cas: Case) => {
    if (!confirm(`⚠️ Supprimer le cas "${cas.name}" ?\n\nCeci supprimera aussi toutes les mentions liées.\n\nCette action est irréversible.`)) {
      return;
    }

    try {
      setActionLoading(cas.id);
      console.log('[DEBUG] Supprimer cas:', cas.id);
      
      const response = await fetch(`/api/cases/${cas.id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erreur suppression');
      }

      setCases(prev => prev.filter(c => c.id !== cas.id));
      console.log('[INFO] Cas supprimé:', cas.id);
      
    } catch (error) {
      console.error('[ERROR] Erreur suppression cas:', error);
      alert('Erreur lors de la suppression: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleScanNow = async (cas: Case) => {
    try {
      setActionLoading(cas.id + '_scan');
      console.log('[DEBUG] Scanner cas:', cas.id);
      
      const response = await fetch('/api/monitoring/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: cas.id })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erreur scan');
      }

      alert(`✅ Scan terminé !\n\n${result.mentionsFound} nouvelles mentions trouvées pour "${cas.name}"`);
      console.log('[INFO] Scan manuel terminé:', cas.id, '-', result.mentionsFound, 'mentions');
      
    } catch (error) {
      console.error('[ERROR] Erreur scan manuel:', error);
      alert('Erreur lors du scan: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    } finally {
      setActionLoading(null);
    }
  };

  if (showCreateForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Créer un cas</h1>
            <p className="text-gray-600">
              Configurez votre surveillance des réseaux sociaux
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowCreateForm(false)}
          >
            <X className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>

        <CreateCaseForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête de la page */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cas de monitoring</h1>
          <p className="text-gray-600">
            Créez et gérez vos cas de surveillance des réseaux sociaux
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau cas
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Liste des cas */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-300 rounded"></div>
                  <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : cases.length === 0 ? (
        /* État vide */
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucun cas de monitoring
              </h3>
              <p className="text-gray-600 mb-4">
                Créez votre premier cas pour commencer la surveillance
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un cas
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Grille des cas */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((cas) => (
            <Card key={cas.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{cas.name}</CardTitle>
                  {getStatusBadge(cas.status)}
                </div>
                {cas.description && (
                  <p className="text-sm text-gray-600">{cas.description}</p>
                )}
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Mots-clés */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">MOTS-CLÉS</p>
                  <div className="flex flex-wrap gap-1">
                    {parseArrayField(cas.keywords).slice(0, 3).map((keyword: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                    {parseArrayField(cas.keywords).length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{parseArrayField(cas.keywords).length - 3}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Plateformes */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">PLATEFORMES</p>
                  <div className="flex space-x-1">
                    {parseArrayField(cas.platforms).map((platform: string) => (
                      <span key={platform} className="text-lg">
                        {platform === 'facebook' ? '📘' : platform === 'reddit' ? '🤖' : platform === 'instagram' ? '📷' : '🌐'}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-3 border-t">
                  {/* Actions principales */}
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleViewCase(cas)}
                      disabled={actionLoading === cas.id}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Voir
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleEditCase(cas)}
                      disabled={actionLoading === cas.id}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleDeleteCase(cas)}
                      disabled={actionLoading === cas.id}
                      title="Supprimer ce cas"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                  
                  {/* Actions de contrôle */}
                  <div className="flex space-x-2">
                    <Button 
                      size="sm"
                      className="flex-1"
                      onClick={() => handleScanNow(cas)}
                      disabled={actionLoading?.includes(cas.id)}
                    >
                      {actionLoading === cas.id + '_scan' ? (
                        <>
                          <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Scan...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Scanner maintenant
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      className={cas.status === 'active' ? 'text-orange-600 border-orange-300' : 'text-green-600 border-green-300'}
                      onClick={() => handleToggleStatus(cas)}
                      disabled={actionLoading === cas.id}
                      title={cas.status === 'active' ? 'Mettre en pause' : 'Activer'}
                    >
                      {actionLoading === cas.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : cas.status === 'active' ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}