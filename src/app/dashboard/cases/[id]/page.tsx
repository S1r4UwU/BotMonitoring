'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface CaseItem {
  id: string;
  name: string;
  description?: string;
  keywords: string; // JSON string
  platforms: string; // JSON string
  status: 'active' | 'paused' | 'archived';
}

interface MentionItem {
  id: string;
  case_id: string;
  platform: 'reddit' | 'facebook' | 'instagram';
  content: string;
  author_name?: string;
  url?: string;
  published_at?: string;
  discovered_at?: string;
  sentiment_score: number | null;
  status: 'new' | 'processed' | 'responded' | 'ignored';
}

export default function CaseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const caseId = params?.id;

  const [cas, setCas] = useState<CaseItem | null>(null);
  const [mentions, setMentions] = useState<MentionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [responsesByMention, setResponsesByMention] = useState<Record<string, { type: string; text: string }[]>>({});

  const parsedKeywords = useMemo(() => {
    try {
      return cas?.keywords ? JSON.parse(cas.keywords) as string[] : [];
    } catch {
      return [];
    }
  }, [cas]);

  useEffect(() => {
    if (!caseId) return;

    const load = async () => {
      try {
        setLoading(true);
        setError('');

        // Charger le cas
        const resCase = await fetch(`/api/cases/${caseId}`);
        const jsonCase = await resCase.json();
        if (!resCase.ok || !jsonCase.success) throw new Error(jsonCase.error || 'Erreur chargement cas');
        setCas(jsonCase.data);

        // Charger les mentions du cas
        const resMentions = await fetch(`/api/mentions?caseId=${caseId}&page=${page}&limit=${limit}`);
        const jsonMentions = await resMentions.json();
        if (!resMentions.ok || !jsonMentions.success) throw new Error(jsonMentions.error || 'Erreur chargement mentions');
        setMentions(jsonMentions.data);
        setTotal(jsonMentions.count || 0);

      } catch {
        setError('Erreur');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [caseId, page, limit]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Détail du cas</h1>
          <p className="text-gray-600">Mentions et paramètres pour ce cas uniquement</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => router.push('/dashboard/cases')}>Retour</Button>
          {cas && (
            <Button onClick={async () => {
              const res = await fetch('/api/monitoring/scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ caseId }) });
              const j = await res.json();
              if (res.ok && j.success) {
                alert(`Scan terminé: ${j.mentionsFound} nouvelles mentions`);
                setPage(1);
              } else {
                alert(j.error || 'Erreur scan');
              }
            }}>Scanner maintenant</Button>
          )}
          {cas && (
            <Button variant="outline" onClick={async () => {
              const res = await fetch('/api/monitoring/scan-simple', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ caseId }) });
              const j = await res.json();
              if (res.ok && j.success) {
                alert(`Test simple: ${j.newMentions} nouvelles mentions`);
                setPage(1);
              } else {
                alert(j.error || 'Erreur test simple');
              }
            }}>🧪 Test simple</Button>
          )}
        </div>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div>Chargement…</div>
      ) : cas ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{cas.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-gray-600">Statut: <Badge>{cas.status}</Badge></div>
                <div className="text-sm text-gray-600">Mots-clés: {parsedKeywords.join(', ') || '—'}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mentions ({total})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mentions.length === 0 ? (
                  <div className="text-gray-600">Aucune mention pour l’instant.</div>
                ) : (
                  mentions.map(m => (
                    <div key={m.id} className="border rounded p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          <Badge variant="secondary">{m.platform}</Badge>
                          <span className="ml-2">{m.author_name || 'Anonyme'}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {m.published_at ? new Date(m.published_at).toLocaleString() : ''}
                        </div>
                      </div>
                      <div className="mt-2 whitespace-pre-wrap text-sm">
                        {m.content}
                      </div>
                      <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                        <div>Sentiment: {m.sentiment_score ?? '—'}</div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={async () => {
                            try {
                              const res = await fetch('/api/responses/generate', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  mentionId: m.id,
                                  mentionContent: m.content,
                                  caseName: cas?.name,
                                  responseType: 'professional',
                                  responseTypes: ['professional','empathetic','firm']
                                })
                              });
                              const j = await res.json();
                              if (res.ok && j.success) {
                                const list = Array.isArray(j.variants) ? j.variants : [{ type: 'professional', text: j.response }];
                                setResponsesByMention(prev => ({ ...prev, [m.id]: list }));
                              } else {
                                alert(j.error || 'Erreur génération réponse');
                              }
                            } catch {
                              alert('Erreur génération réponse');
                            }
                          }}>Répondre</Button>
                          {m.url && <a href={m.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Ouvrir</a>}
                        </div>
                      </div>

                      {responsesByMention[m.id] && responsesByMention[m.id].length > 0 && (
                        <div className="mt-3 space-y-2">
                          {responsesByMention[m.id].map((v, idx) => (
                            <div key={idx} className="rounded border p-2 bg-gray-50">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-600">Variante: {v.type}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => navigator.clipboard?.writeText(v.text).catch(() => {})}
                                >
                                  Copier
                                </Button>
                              </div>
                              <div className="mt-1 text-sm whitespace-pre-wrap">{v.text}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <Button variant="outline" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Précédent</Button>
                <div className="text-sm text-gray-600">Page {page} / {totalPages}</div>
                <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Suivant</Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <div>Cas introuvable.</div>
      )}
    </div>
  );
}


