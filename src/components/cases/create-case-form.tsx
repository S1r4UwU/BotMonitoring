'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Loader2, CheckCircle } from 'lucide-react';

interface Platform {
  id: 'facebook' | 'instagram' | 'reddit' | 'youtube' | 'hackernews' | 'newsapi' | 'mastodon' | 'telegram' | 'discord';
  name: string;
  icon: string;
  description: string;
}

const platforms: Platform[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '📘',
    description: 'Posts et pages publiques'
  },
  {
    id: 'reddit',
    name: 'Reddit',
    icon: '🤖',
    description: 'Subreddits et recherche globale'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📷',
    description: 'Posts et stories (nécessite Business Account)'
  },
  { id: 'youtube', name: 'YouTube', icon: '📺', description: 'Vidéos publiques et commentaires' },
  { id: 'hackernews', name: 'Hacker News', icon: '🟠', description: 'Stories et commentaires HN' },
  { id: 'newsapi', name: 'News API', icon: '📰', description: 'Articles web via NewsAPI' },
  { id: 'mastodon', name: 'Mastodon', icon: '🐘', description: 'Statuts publics (instance choisie)' },
  { id: 'telegram', name: 'Telegram', icon: '✈️', description: 'Canaux publics (bot membre requis)' },
  { id: 'discord', name: 'Discord', icon: '💬', description: 'Serveurs/canaux publics (bot + intents)' }
];

interface CreateCaseFormProps {
  onSuccess?: (caseData: { id: string; name: string }) => void;
  onCancel?: () => void;
}

export function CreateCaseForm({ onSuccess, onCancel }: CreateCaseFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    keywords: '',
    selectedPlatforms: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // Recherche avancée et filtres
  const [useAdvancedSearch, setUseAdvancedSearch] = useState(true);
  const [advancedKeywordGroups, setAdvancedKeywordGroups] = useState([
    { operator: 'ET', keywords: [''] },
    { operator: 'OU', keywords: [''] },
    { operator: 'NON', keywords: [''] }
  ] as { operator: 'ET' | 'OU' | 'NON'; keywords: string[] }[]);
  const [filters, setFilters] = useState({
    languages: ['fr'] as string[],
    countries: ['FR'] as string[],
    excludeLanguages: ['en'] as string[],
    timeRange: '7d'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validation côté client
      if (!formData.name.trim()) {
        setError('Le nom du cas est requis');
        return;
      }

      if (!formData.keywords.trim()) {
        setError('Au moins un mot-clé est requis');
        return;
      }

      if (formData.selectedPlatforms.length === 0) {
        setError('Sélectionnez au moins une plateforme');
        return;
      }

      // Préparer les données
      let keywords = formData.keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);

      // Construire requête booléenne si activée
      if (useAdvancedSearch) {
        try {
          const { AdvancedSearchEngine } = await import('@/services/search/advanced-search');
          const engine = new AdvancedSearchEngine();
          // Fusionner les mots-clés de base dans le groupe ET
          const baseKeywords = formData.keywords
            .split(',')
            .map(k => k.trim())
            .filter(Boolean);
          const groups = advancedKeywordGroups.map(g => ({ ...g, keywords: [...g.keywords] }));
          const etIndex = groups.findIndex(g => g.operator === 'ET');
          if (etIndex >= 0) {
            groups[etIndex].keywords = Array.from(new Set([...(groups[etIndex].keywords || []), ...baseKeywords]));
          } else if (baseKeywords.length > 0) {
            groups.unshift({ operator: 'ET', keywords: baseKeywords });
          }
          const previewQuery = engine.buildSearchQuery(groups as Array<{ operator: 'ET' | 'OU' | 'NON'; keywords: string[] }>);
          keywords = [previewQuery];
        } catch {
          console.warn('AdvancedSearchEngine indisponible, fallback mots-clés simples');
        }
      }

      const caseData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        keywords,
        platforms: formData.selectedPlatforms,
        filters
      };

      console.log('[DEBUG] Création cas avec données:', caseData);

      // Appel API
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(caseData)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erreur lors de la création');
      }

      setSuccess('Cas créé avec succès !');
      console.log('[INFO] Cas créé:', result.data);

      // Reset du formulaire
      setFormData({
        name: '',
        description: '',
        keywords: '',
        selectedPlatforms: []
      });

      // Callback de succès
      if (onSuccess) {
        setTimeout(() => onSuccess(result.data), 1000);
      }

    } catch (err) {
      console.error('[ERROR] Création cas:', err);
      setError(err instanceof Error ? err.message : 'Erreur inattendue');
    } finally {
      setLoading(false);
    }
  };

  const handlePlatformToggle = (platformId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedPlatforms: prev.selectedPlatforms.includes(platformId)
        ? prev.selectedPlatforms.filter(p => p !== platformId)
        : [...prev.selectedPlatforms, platformId]
    }));
  };

  // suppression de handleKeywordAdd (non utilisé)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Plus className="h-5 w-5 mr-2 text-blue-600" />
          Nouveau cas de monitoring
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de base */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nom du cas *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Surveillance marque principale"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description optionnelle du cas de monitoring"
                rows={3}
              />
            </div>
          </div>

          {/* Mots-clés */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Mots-clés *</Label>
              <div className="text-sm flex items-center gap-2">
                <span>Recherche avancée</span>
                <input type="checkbox" checked={useAdvancedSearch} onChange={(e) => setUseAdvancedSearch(e.target.checked)} />
              </div>
            </div>

            {useAdvancedSearch ? (
              <div className="space-y-3">
                <div className="border rounded p-3 space-y-2">
                  <div className="text-sm text-gray-600">Groupes (ET / OU / NON)</div>
                  <div className="grid gap-2">
                    {['ET','OU','NON'].map((op, idx) => (
                      <div key={op} className="space-y-1">
                        <div className="text-xs font-medium">{op}</div>
                        <input
                          className="w-full border rounded px-2 py-1 text-sm"
                          placeholder={op === 'ET' ? 'ex: Quick, restaurant, burger' : op === 'OU' ? 'ex: avis, opinion, review' : 'ex: fast, speed'}
                          value={(advancedKeywordGroups[idx] && advancedKeywordGroups[idx].keywords.join(', ')) || ''}
                          onChange={(e) => {
                            const parts = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                            setAdvancedKeywordGroups(prev => {
                              const clone = [...prev];
                              clone[idx] = { operator: op as 'ET' | 'OU' | 'NON', keywords: parts };
                              return clone;
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="bg-gray-50 rounded p-2 text-xs">
                    Aperçu:
                    <span className="ml-1 font-mono">
                      {(() => {
                        const base = (formData.keywords || '')
                          .split(',')
                          .map(s => s.trim())
                          .filter(Boolean)
                          .map(k => `&quot;${k}&quot;`).join(' ');
                        const et = (advancedKeywordGroups[0]?.keywords || []).filter(Boolean).map(k => `&quot;${k}&quot;`).join(' ');
                        const ou = (advancedKeywordGroups[1]?.keywords || []).filter(Boolean).map(k => `&quot;${k}&quot;`).join(' OR ');
                        const non = (advancedKeywordGroups[2]?.keywords || []).filter(Boolean).map(k => `-&quot;${k}&quot;`).join(' ');
                        return [base, et, ou ? `(${ou})` : '', non].filter(Boolean).join(' ').trim() || '—';
                      })()}
                    </span>
                  </div>
                  <div className="pt-2 border-t mt-2">
                    <Label htmlFor="keywords-base" className="text-xs">Mots-clés de base (ajoutés au groupe ET)</Label>
                    <Input
                      id="keywords-base"
                      value={formData.keywords}
                      onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
                      placeholder="mot-clé1, mot-clé2, marque, produit"
                    />
                    <p className="text-xs text-gray-500 mt-1">Ces mots s’ajoutent au groupe ET. Séparez par des virgules.</p>
                  </div>
                </div>
              </div>
            ) : (
              <Input
                id="keywords"
                value={formData.keywords}
                onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
                placeholder="mot-clé1, mot-clé2, marque, produit"
                required
              />
            )}
            {!useAdvancedSearch && (
              <p className="text-xs text-gray-500 mt-1">
                Séparez les mots-clés par des virgules. Ex: &quot;ma-marque, mon-produit, service-client&quot;
              </p>
            )}
          </div>

          {/* Filtres basiques langues */}
          <div className="space-y-2">
            <Label>Langues</Label>
            <div className="flex flex-wrap gap-2">
              {[
                { code: 'fr', label: 'Français' },
                { code: 'en', label: 'Anglais' },
                { code: 'es', label: 'Espagnol' },
                { code: 'de', label: 'Allemand' },
                { code: 'it', label: 'Italien' }
              ].map(l => (
                <button
                  type="button"
                  key={l.code}
                  className={`text-xs px-2 py-1 rounded border ${filters.languages.includes(l.code) ? 'bg-gray-900 text-white' : 'bg-white'}`}
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    languages: prev.languages.includes(l.code)
                      ? prev.languages.filter(c => c !== l.code)
                      : [...prev.languages, l.code]
                  }))}
                >{l.label}</button>
              ))}
            </div>
            <Label className="mt-2 block">Langues exclues</Label>
            <div className="flex flex-wrap gap-2">
              {['fr','en','es','de','it'].map(code => (
                <button
                  type="button"
                  key={code}
                  className={`text-xs px-2 py-1 rounded border ${filters.excludeLanguages.includes(code) ? 'bg-red-100 border-red-300' : 'bg-white'}`}
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    excludeLanguages: prev.excludeLanguages.includes(code)
                      ? prev.excludeLanguages.filter(c => c !== code)
                      : [...prev.excludeLanguages, code]
                  }))}
                >{code.toUpperCase()}</button>
              ))}
            </div>
          </div>

          {/* Plateformes */}
          <div>
            <Label className="text-base font-medium">Plateformes à surveiller *</Label>
            <div className="grid grid-cols-1 gap-3 mt-3">
              {platforms.map((platform) => (
                <div
                  key={platform.id}
                  className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.selectedPlatforms.includes(platform.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => handlePlatformToggle(platform.id)}
                >
                  <Checkbox
                    checked={formData.selectedPlatforms.includes(platform.id)}
                    onChange={() => handlePlatformToggle(platform.id)}
                  />
                  <span className="text-2xl">{platform.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium">{platform.name}</div>
                    <div className="text-sm text-gray-600">{platform.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                className="flex-1"
              >
                Annuler
              </Button>
            )}
            
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer le cas
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
