# SocialGuard - Monitoring des Réseaux Sociaux

## 🚀 Vue d'ensemble

SocialGuard est une application de monitoring des réseaux sociaux conçue pour protéger les entreprises et gérer leur réputation en ligne avec un budget minimal. **Mode App-Only** : accès direct au dashboard sans pages marketing.

### 🎯 Fonctionnement "App-First"

- **Page d'accueil** : Login/Signup direct ou accès démo immédiat
- **Pas de marketing** : Aucune section commerciale, pricing ou argumentaire
- **Dashboard-first** : Accès immédiat aux fonctionnalités de monitoring
- **Mode démo intégré** : Test complet sans configuration

## 🏗️ Architecture Technique

### Stack Technologique
- **Frontend**: Next.js 14+ avec TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js avec Express, TypeScript
- **Base de données**: Supabase (PostgreSQL) + Upstash Redis pour le cache
- **Authentication**: Supabase Auth avec Row Level Security
- **APIs externes**: Facebook Graph API, Instagram Graph API, Reddit API
- **IA**: Claude 3.5 Sonnet / GPT-4 (usage frugal)
- **Automatisation**: n8n (self-hosted)
- **Email**: SMTP2GO Free Tier

### Budget Cible
- **MVP**: < 50€/mois en utilisant les tiers gratuits
- **Extension**: < 100€/mois avec IA et volume supplémentaire

## 📋 Fonctionnalités Core

### ✅ Implémentées
- [x] Structure du projet Next.js 14 avec TypeScript
- [x] Configuration Supabase avec schéma complet
- [x] Système d'authentification (Login/Signup)
- [x] Types TypeScript complets
- [x] Middleware de protection des routes
- [x] Landing page responsive
- [x] Composants UI avec shadcn/ui

### 🔄 En développement
- [ ] Dashboard principal
- [ ] Système de cas de monitoring
- [ ] Moteur de monitoring multi-plateforme
- [ ] Analyse de sentiment IA frugale
- [ ] Système de réponses automatiques
- [ ] Analytics et métriques temps réel

## 🚀 Démarrage Immédiat

### Option 1: Mode Démo (Recommandé pour tester)
```bash
git clone <repository-url>
cd botmonitoring
npm install
npm run dev
```
**➡️ Visitez http://localhost:3000 et cliquez "Accès démo"**

### Option 2: Installation Complète

#### Prérequis
- Node.js 18+ 
- npm ou yarn
- Compte Supabase (gratuit) - optionnel
- Compte Upstash Redis (gratuit) - optionnel

#### Configuration complète

1. **Créer le fichier `.env.local`** (à la racine) :

**Mode Démo (par défaut):**
```env
# Mode démo - aucune configuration requise
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

**Mode Production (avec Supabase):**
```env
# Désactiver le mode démo
NEXT_PUBLIC_DEMO_MODE=false

# Configuration Supabase (obligatoire)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Configuration optionnelle
UPSTASH_REDIS_REST_URL=your_redis_url
FACEBOOK_APP_ID=your_facebook_app_id
CLAUDE_API_KEY=your_claude_api_key
RESEND_API_KEY=your_resend_api_key

NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

2. **Démarrer l'application**
```bash
npm run dev
```

3. **Accéder à l'application**
- **Mode démo** : http://localhost:3000 → "Accès démo"
- **Mode production** : Configurer Supabase d'abord (étape optionnelle ci-dessous)

### Configuration Supabase (Mode Production)

**Seulement si vous voulez des données réelles :**

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Copier l'URL et les clés dans `.env.local`
3. Exécuter le schéma : copier `src/models/database.sql` dans l'éditeur SQL Supabase
4. Optionnel : insérer des données de test avec `src/scripts/seed-demo-data.sql`

## 🔧 Configuration des APIs Externes

### Facebook & Instagram Graph API
1. Créer une app sur [Facebook for Developers](https://developers.facebook.com/)
2. Configurer les permissions nécessaires
3. Générer les tokens d'accès

### Reddit API
1. Créer une app sur [Reddit Apps](https://www.reddit.com/prefs/apps)
2. Noter le client ID et secret

### Sources Gratuites supplémentaires

#### YouTube Data API (gratuit 10k unités/jour)
1. Activer "YouTube Data API v3" via la Google Cloud Console
2. Créer une clé API et l'ajouter à `.env.local`
```
YOUTUBE_API_KEY=your_youtube_api_key
```

#### NewsAPI (gratuit 1k requêtes/jour)
1. Créer un compte sur `https://newsapi.org/register`
2. Récupérer la clé et l'ajouter à `.env.local`
```
NEWS_API_KEY=your_news_api_key
```

#### Mastodon (gratuit)
1. Choisir une instance (ex: `https://mastodon.social`)
2. Définir l'instance par défaut dans `.env.local`
```
MASTODON_INSTANCE_URL=https://mastodon.social
```

Les plateformes gratuites activées: Reddit, YouTube, Hacker News, NewsAPI, Mastodon, Telegram, Discord.

### Upstash Redis
1. Créer un compte sur [Upstash](https://upstash.com/)
2. Créer une base Redis (Free tier)
3. Copier les URLs et tokens

### SMTP2GO
1. Créer un compte sur [SMTP2GO](https://www.smtp2go.com/)
2. Configurer les credentials SMTP

## 📱 Utilisation App-Only

### Au premier lancement (http://localhost:3000)

**Trois options d'accès :**

1. **🎮 Accès démo** (recommandé)
   - Clic sur "Accès démo (essayer immédiatement)"
   - Dashboard complet avec données de test
   - Aucune configuration requise

2. **🔐 Google OAuth** 
   - Authentification rapide avec Google
   - Nécessite la configuration Supabase

3. **📧 Email/Password**
   - Création de compte classique
   - Nécessite la configuration Supabase

### Navigation Dashboard

**Menu principal :**
- **Dashboard** - Vue d'ensemble et métriques
- **Mentions** - Toutes les mentions surveillées  
- **Cas** - Gestion des cas de monitoring
- **Réponses** - Système de réponses automatiques
- **Paramètres** - Configuration compte et APIs

### Mode Démo vs Production

| Fonctionnalité | Mode Démo | Mode Production |
|---|---|---|
| Dashboard | ✅ Données simulées | ✅ Données réelles |
| Mentions | ✅ 5 exemples | ✅ APIs connectées |
| Authentification | ❌ Désactivée | ✅ Supabase Auth |
| Sauvegarde | ❌ Temporaire | ✅ Base de données |
| APIs externes | ❌ Simulées | ✅ Facebook/Instagram/Reddit |
| Watermark | ✅ "Mode démo" | ❌ Aucun |

## 🔒 Sécurité

### Authentification
- Supabase Auth avec Row Level Security (RLS)
- JWT tokens sécurisés
- Protection CSRF intégrée

### Permissions
- Système de rôles : admin, manager, user
- Permissions granulaires par cas
- Isolation des données par utilisateur

### Rate Limiting
- Rate limiting logiciel
- Respect des quotas APIs externes
- Monitoring des erreurs

## 📊 Monitoring et Métriques

### Dashboard Metrics
- Volume de mentions par plateforme
- Distribution du sentiment
- Taux de réponse
- Alertes critiques

### Analytics
- Tendances temporelles
- Top keywords
- Performance des réponses
- ROI du monitoring

## 🤖 IA Frugale

### Stratégie de Coûts
- Usage IA uniquement pour cas critiques
- Fallback sur templates statiques
- Prompts optimisés (< 200 tokens)
- Cache des résultats fréquents

### Prompts Optimisés
```
Analyse sentiment (-5 à +5), urgence (1-10), résumé contextuel, et recommandation succincte, en <200 tokens.
```

## 🚢 Déploiement

### Vercel (Recommandé)
```bash
npm run build
vercel --prod
```

### Auto-hébergement
```bash
npm run build
npm start
```

### Docker
```dockerfile
# Dockerfile disponible dans le repository
docker build -t socialguard .
docker run -p 3000:3000 socialguard
```

## 🧪 Tests

```bash
# Tests unitaires
npm run test

# Tests d'intégration
npm run test:integration

# Tests e2e
npm run test:e2e
```

## 📈 Évolutivité

### Mise à l'échelle
- Migration vers tiers payants selon le PMF
- Optimisation des requêtes DB
- CDN pour les assets statiques
- Load balancing horizontal

### Monitoring Production
- Logs centralisés
- Métriques de performance
- Alertes système
- Health checks automatiques

## 🛠️ Développement

### Standards de Code
- TypeScript strict
- ESLint + Prettier
- Conventional commits
- Tests obligatoires pour les APIs

### Contribution
1. Fork du projet
2. Créer une branche feature
3. Développer avec tests
4. Pull request avec description détaillée

## 📞 Support

### Documentation
- [API Reference](./docs/api.md)
- [Deployment Guide](./docs/deployment.md)
- [Troubleshooting](./docs/troubleshooting.md)

### Contact
- Email: support@socialguard.dev
- Discord: [Lien vers le serveur]
- GitHub Issues: [Lien vers les issues]

## 📜 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- [Supabase](https://supabase.com/) pour la base de données
- [Vercel](https://vercel.com/) pour l'hébergement
- [shadcn/ui](https://ui.shadcn.com/) pour les composants UI
- [Upstash](https://upstash.com/) pour Redis

---

**SocialGuard** - Protection des réseaux sociaux à budget minimal 🛡️