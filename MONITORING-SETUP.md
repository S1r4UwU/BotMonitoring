# Guide de Configuration du Monitoring SocialGuard

## 🚀 Configuration Rapide des APIs

### 1. Facebook Graph API (Gratuit)

**Étapes :**
1. Aller sur [Facebook for Developers](https://developers.facebook.com/)
2. Créer une nouvelle app
3. Ajouter "Facebook Login" et "Instagram Basic Display" si besoin
4. Noter votre App ID et App Secret

**Variables à ajouter dans `.env.local` :**
```env
FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_APP_SECRET=your_app_secret_here
```

**Limites Free Tier :**
- 200 requêtes/heure par défaut
- Augmente avec l'usage légitime
- Monitoring des pages publiques seulement

### 2. Reddit API (Gratuit)

**Étapes :**
1. Créer un compte Reddit
2. Aller sur [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps)
3. Créer une "web app"
4. Noter client_id et client_secret

**Variables à ajouter dans `.env.local` :**
```env
REDDIT_CLIENT_ID=your_client_id_here
REDDIT_CLIENT_SECRET=your_client_secret_here
REDDIT_USER_AGENT=SocialGuard/1.0 by YourUsername
```

**Limites Free Tier :**
- 100 requêtes/minute
- 1000 requêtes/heure
- Accès aux posts publics

### 3. Email Alerts - Resend (Gratuit)

**Étapes :**
1. Créer un compte sur [resend.com](https://resend.com/)
2. Vérifier votre domaine (optionnel mais recommandé)
3. Créer une clé API

**Variables à ajouter dans `.env.local` :**
```env
RESEND_API_KEY=your_resend_api_key_here
```

**Limites Free Tier :**
- 3000 emails/mois (3x plus que SMTP2GO)
- Excellent taux de délivrabilité
- Dashboard analytics inclus

### 4. IA Sentiment Analysis (Optionnel)

**Claude 3.5 Sonnet (Recommandé) :**
```env
ANTHROPIC_API_KEY=your_claude_key_here
```

**OpenAI (Alternative) :**
```env
OPENAI_API_KEY=your_openai_key_here
```

**Budget automatique :** 10€/mois maximum

## 🔧 Test des Configurations

### Via Dashboard
1. Aller dans **Dashboard > Monitoring**
2. Vérifier le panneau "État des APIs"
3. Tester chaque connexion individuellement

### Via Terminal
```bash
# Test de toutes les APIs
curl http://localhost:3000/api/monitoring/test-apis

# Test sentiment analysis
curl -X POST http://localhost:3000/api/sentiment/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "Ce produit est fantastique!", "isUrgent": false}'
```

## 📊 Surveillance en Action

### Configuration d'un Cas de Monitoring

1. **Créer un cas** (via base de données pour l'instant) :
```sql
INSERT INTO cases (name, keywords, platforms, owner_id, status) VALUES (
  'Ma Marque',
  '["ma-marque", "mon-produit"]',
  '["facebook", "reddit"]',
  'your-user-id',
  'active'
);
```

2. **Scanner manuellement** :
- Dashboard > Monitoring > "Scan manuel"
- Ou via API : `POST /api/monitoring/scan`

3. **Surveillance automatique** :
- Intervalle par défaut : 15 minutes
- Configurable par cas
- Auto-arrêt si quotas épuisés

### Types d'Alertes Automatiques

**Critiques (Email immédiat) :**
- Sentiment ≤ -3
- Score urgence ≥ 8
- Mots-clés sensibles détectés

**Modérées (Digest quotidien) :**
- Volume augmentation >200%
- Sentiment entre -3 et -1
- Nouveaux mots-clés détectés

## 💰 Optimisation Budget

### Monitoring Frugal

**Données gratuites :**
- Reddit : 100 req/min gratuites
- Facebook : 200 req/heure gratuites
- Analyse lexique : 100% gratuite

**Usage IA limité :**
- Seulement pour sentiment ≤ -3
- Budget max : 10€/mois automatique
- Fallback lexique si quota dépassé

**Emails :**
- SMTP2GO : 1000 emails/mois gratuits
- Priorisation des alertes critiques
- Digest groupé pour le reste

### Surveillance du Budget

**Dashboard > Budget Monitor :**
- Usage IA temps réel
- Quota emails restant
- Estimation coûts mensuels
- Alertes automatiques

**Auto-limitation :**
- Arrêt IA si budget dépassé
- Throttling automatique des APIs
- Mode dégradé si quotas épuisés

## 🔍 Utilisation Quotidienne

### Workflow Type

**Matin (5 min) :**
1. Consulter Dashboard
2. Vérifier alertes critiques
3. Scanner manuel si besoin

**Après-midi (10 min) :**
1. Analyser nouvelles mentions
2. Marquer comme traitées
3. Répondre aux mentions critiques

**Soir (5 min) :**
1. Vérifier métriques journalières
2. Ajuster mots-clés si besoin
3. Lire digest email

### Actions Recommandées

**Par priorité d'urgence :**

1. **Score 9-10** : Réponse immédiate (<1h)
2. **Score 7-8** : Réponse dans la journée
3. **Score 5-6** : Monitoring renforcé
4. **Score 1-4** : Surveillance normale

**Par sentiment :**

1. **-5 à -3** : IA analysis + réponse rapide
2. **-2 à -1** : Monitoring attentif
3. **0** : Surveillance normale  
4. **+1 à +5** : Engagement positif optionnel

## 🛠️ Maintenance

### Quotidienne
- Vérifier status APIs (automatique)
- Contrôler budget IA (dashboard)
- Traiter alertes critiques

### Hebdomadaire  
- Analyser tendances mentions
- Ajuster mots-clés selon performance
- Optimiser intervalles de scanning

### Mensuelle
- Réviser budget et usage
- Analyser ROI du monitoring
- Mettre à jour configuration APIs

## 📈 Évolution Post-MVP

### Fonctionnalités Avancées (>PMF)
- Monitoring Instagram Business
- Sentiment analysis temps réel
- Auto-responses avec IA
- Analytics avancées
- API externe webhooks

### Budget Scaling
- **<50€/mois** : Free tiers + IA limitée
- **50-100€/mois** : APIs Pro + IA étendue  
- **>100€/mois** : Monitoring 24/7 + features premium

---

🎯 **Objectif :** Monitoring efficace à <10€/mois d'usage réel avec dégradation gracieuse.
