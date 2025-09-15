-- Script pour insérer des données de démo dans Supabase
-- À exécuter dans l'éditeur SQL de Supabase pour tester le dashboard avec de vraies données

-- Insérer un profil de test (remplacer l'UUID par celui de votre utilisateur)
INSERT INTO public.profiles (id, email, full_name, company_name, role) 
VALUES (
  'your-user-uuid-here',
  'demo@socialguard.dev',
  'Utilisateur Démo',
  'SocialGuard Demo',
  'admin'
) ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  company_name = EXCLUDED.company_name,
  role = EXCLUDED.role;

-- Insérer des cas de monitoring de démo
INSERT INTO public.cases (id, name, description, keywords, platforms, status, owner_id) VALUES
(
  'demo-case-1',
  'Surveillance Marque Principale',
  'Monitoring de la réputation de notre marque sur tous les canaux',
  '["notre-marque", "produit-phare", "service-client"]',
  '["facebook", "instagram", "reddit"]',
  'active',
  'your-user-uuid-here'
),
(
  'demo-case-2',
  'Concurrence - Analyse',
  'Surveillance des mentions de nos concurrents',
  '["concurrent-a", "concurrent-b"]',
  '["reddit"]',
  'active',
  'your-user-uuid-here'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  keywords = EXCLUDED.keywords,
  platforms = EXCLUDED.platforms,
  status = EXCLUDED.status;

-- Insérer des mentions de démo
INSERT INTO public.mentions (
  id, case_id, platform, external_id, content, author_name, author_handle, 
  author_id, url, published_at, discovered_at, sentiment_score, urgency_score, 
  keywords_matched, status, metadata
) VALUES
(
  'mention-1',
  'demo-case-1',
  'facebook',
  'fb_post_123456',
  'Super expérience avec votre service client ! Ils ont résolu mon problème très rapidement. Je recommande vivement !',
  'Marie Dupont',
  'marie.dupont',
  'fb_user_123',
  'https://facebook.com/post/123456',
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '1 hour',
  4,
  3,
  '["service-client"]',
  'new',
  '{"likes_count": 15, "shares_count": 3, "comments_count": 2}'
),
(
  'mention-2',
  'demo-case-1',
  'instagram',
  'ig_post_789012',
  'Déçu de mon dernier achat... La qualité n''est plus ce qu''elle était. J''espère que vous allez améliorer cela.',
  'Jean Martin',
  'jean.martin.pro',
  'ig_user_789',
  'https://instagram.com/p/789012',
  NOW() - INTERVAL '4 hours',
  NOW() - INTERVAL '3 hours',
  -3,
  7,
  '["notre-marque"]',
  'new',
  '{"likes_count": 8, "comments_count": 5}'
),
(
  'mention-3',
  'demo-case-2',
  'reddit',
  'reddit_post_345678',
  'Quelqu''un a déjà testé concurrent-a vs notre-marque ? J''hésite entre les deux pour mon prochain projet.',
  'TechEnthusiast42',
  'TechEnthusiast42',
  'reddit_user_345',
  'https://reddit.com/r/technology/comments/345678',
  NOW() - INTERVAL '6 hours',
  NOW() - INTERVAL '5 hours',
  0,
  5,
  '["concurrent-a", "notre-marque"]',
  'processed',
  '{"upvotes": 12, "downvotes": 2, "comments_count": 8}'
),
(
  'mention-4',
  'demo-case-1',
  'facebook',
  'fb_post_901234',
  'Attention à cette marque ! J''ai eu des problèmes avec leur produit-phare. Service client injoignable !',
  'Client Mécontent',
  'client.mecontent',
  'fb_user_901',
  'https://facebook.com/post/901234',
  NOW() - INTERVAL '8 hours',
  NOW() - INTERVAL '7 hours',
  -4,
  9,
  '["produit-phare", "service-client"]',
  'responded',
  '{"likes_count": 3, "shares_count": 1, "comments_count": 12}'
),
(
  'mention-5',
  'demo-case-1',
  'instagram',
  'ig_story_567890',
  'Juste reçu mon nouveau produit-phare ! Unboxing en story ! 📦✨ #satisfied',
  'Influencer Mode',
  'influencer.mode',
  'ig_user_567',
  'https://instagram.com/stories/567890',
  NOW() - INTERVAL '30 minutes',
  NOW() - INTERVAL '15 minutes',
  3,
  4,
  '["produit-phare"]',
  'new',
  '{"views_count": 1250, "reactions_count": 45}'
) ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  sentiment_score = EXCLUDED.sentiment_score,
  urgency_score = EXCLUDED.urgency_score,
  status = EXCLUDED.status,
  metadata = EXCLUDED.metadata;

-- Insérer quelques templates de réponse
INSERT INTO public.response_templates (
  id, case_id, name, content, category, variables, created_by
) VALUES
(
  'template-1',
  'demo-case-1',
  'Réponse Positive Standard',
  'Merci beaucoup pour votre retour positif sur {{produit}} ! Nous sommes ravis que vous soyez satisfait(e).',
  'positive',
  '["produit"]',
  'your-user-uuid-here'
),
(
  'template-2',
  'demo-case-1',
  'Gestion Réclamation',
  'Nous sommes désolés d''apprendre vos difficultés avec {{produit}}. Nous vous contactons en privé pour résoudre cela rapidement.',
  'negative',
  '["produit"]',
  'your-user-uuid-here'
) ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  category = EXCLUDED.category,
  variables = EXCLUDED.variables;

-- Insérer quelques alertes de test
INSERT INTO public.alerts (
  id, case_id, mention_id, type, title, description, severity, status
) VALUES
(
  'alert-1',
  'demo-case-1',
  'mention-4',
  'sentiment_drop',
  'Sentiment négatif détecté',
  'Une mention avec un sentiment très négatif (-4) a été détectée sur Facebook',
  'high',
  'new'
),
(
  'alert-2',
  'demo-case-1',
  NULL,
  'volume_spike',
  'Pic de mentions détecté',
  'Le volume de mentions a augmenté de 200% dans les dernières 2 heures',
  'medium',
  'acknowledged'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  severity = EXCLUDED.severity,
  status = EXCLUDED.status;

-- Mettre à jour les métriques quotidiennes
INSERT INTO public.metrics (
  case_id, date, platform, mention_count, positive_mentions, 
  negative_mentions, neutral_mentions, response_count, avg_sentiment, top_keywords
) VALUES
(
  'demo-case-1',
  CURRENT_DATE,
  'facebook',
  2,
  1,
  1,
  0,
  1,
  0.0,
  '["service-client", "produit-phare"]'
),
(
  'demo-case-1',
  CURRENT_DATE,
  'instagram',
  2,
  1,
  1,
  0,
  0,
  0.0,
  '["produit-phare", "notre-marque"]'
),
(
  'demo-case-2',
  CURRENT_DATE,
  'reddit',
  1,
  0,
  0,
  1,
  0,
  0.0,
  '["concurrent-a", "notre-marque"]'
) ON CONFLICT (case_id, date, platform) DO UPDATE SET
  mention_count = EXCLUDED.mention_count,
  positive_mentions = EXCLUDED.positive_mentions,
  negative_mentions = EXCLUDED.negative_mentions,
  neutral_mentions = EXCLUDED.neutral_mentions,
  response_count = EXCLUDED.response_count,
  avg_sentiment = EXCLUDED.avg_sentiment,
  top_keywords = EXCLUDED.top_keywords;

-- Message de confirmation
SELECT 'Données de démo insérées avec succès ! Vous pouvez maintenant tester le dashboard.' as message;
