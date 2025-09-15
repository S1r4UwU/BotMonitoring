# Guide de Déploiement SocialGuard 🚀

## Déploiement Rapide (Free Tier)

### 1. Configuration Supabase

1. **Créer un projet Supabase**
   - Aller sur [supabase.com](https://supabase.com)
   - Créer un nouveau projet (gratuit)
   - Noter l'URL et les clés API

2. **Exécuter le schéma de base de données**
   ```sql
   -- Copier et coller le contenu de src/models/database.sql
   -- dans l'éditeur SQL de Supabase
   ```

3. **Insérer des données de test** (optionnel)
   ```sql
   -- Remplacer 'your-user-uuid-here' par votre UUID utilisateur
   -- Exécuter le contenu de src/scripts/seed-demo-data.sql
   ```

### 2. Configuration des Variables d'Environnement

Créer un fichier `.env.local` :

```bash
# Supabase (OBLIGATOIRE)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Redis - Upstash (OPTIONNEL pour MVP)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# APIs Réseaux Sociaux (OPTIONNEL pour MVP)
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
INSTAGRAM_ACCESS_TOKEN=your-instagram-token
REDDIT_CLIENT_ID=your-reddit-client-id
REDDIT_CLIENT_SECRET=your-reddit-client-secret

# IA (OPTIONNEL pour MVP)
CLAUDE_API_KEY=your-claude-key
OPENAI_API_KEY=your-openai-key

# Email (OPTIONNEL pour MVP)
SMTP_HOST=mail.smtp2go.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password

# Sécurité
JWT_SECRET=your-super-secure-secret-here
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 3. Déploiement sur Vercel (Gratuit)

1. **Installation et build local**
   ```bash
   npm install
   npm run build
   npm run start
   # Tester sur http://localhost:3000
   ```

2. **Déploiement Vercel**
   ```bash
   # Option 1: CLI Vercel
   npm install -g vercel
   vercel --prod

   # Option 2: GitHub + Vercel Dashboard
   # 1. Push sur GitHub
   # 2. Connecter sur vercel.com
   # 3. Import du repo GitHub
   # 4. Configurer les variables d'environnement
   ```

3. **Configuration Vercel Dashboard**
   - Aller dans Settings > Environment Variables
   - Ajouter toutes les variables du `.env.local`
   - Redéployer automatiquement

### 4. Configuration OAuth (Google)

1. **Google Cloud Console**
   - Créer un projet sur [console.cloud.google.com](https://console.cloud.google.com)
   - Activer Google+ API
   - Créer des identifiants OAuth 2.0

2. **Supabase Auth**
   - Aller dans Authentication > Settings > Auth Providers
   - Activer Google OAuth
   - Ajouter Client ID et Secret
   - Ajouter les URLs de redirection :
     - `https://your-project.supabase.co/auth/v1/callback`

### 5. Mode Production vs Démo

```bash
# Mode Démo (utilise les données de test intégrées)
NEXT_PUBLIC_DEMO_MODE=true

# Mode Production (utilise Supabase)
NEXT_PUBLIC_DEMO_MODE=false
```

En mode démo, l'application fonctionne sans configuration Supabase avec des données fictives.

## Déploiement Alternatifs

### Netlify (Gratuit)
```bash
# Build settings
Build command: npm run build
Publish directory: out
```

### Railway (Gratuit puis payant)
```bash
railway login
railway init
railway up
```

### Auto-hébergement (VPS)

```bash
# Sur votre serveur Ubuntu/Debian
git clone <your-repo>
cd socialguard
npm install
npm run build

# PM2 pour la gestion des processus
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Exemple `ecosystem.config.js` :
```javascript
module.exports = {
  apps: [{
    name: 'socialguard',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

## Configuration des APIs Externes (Post-MVP)

### Facebook Graph API
1. Créer une app Facebook Developer
2. Demander les permissions pages_read_engagement
3. Générer un token de page longue durée

### Instagram Basic Display API
1. Créer une app Instagram Basic Display
2. Ajouter les utilisateurs de test
3. Générer les tokens d'accès

### Reddit API
1. Créer une app sur reddit.com/prefs/apps
2. Type: web app
3. Noter client_id et client_secret

### Configuration SMTP2GO
1. Créer un compte gratuit sur smtp2go.com
2. Vérifier votre domaine (optionnel)
3. Générer les credentials SMTP

### Configuration Upstash Redis
1. Créer un compte sur upstash.com
2. Créer une base Redis (30 000 requêtes/mois gratuites)
3. Noter l'URL REST et le token

## Monitoring et Maintenance

### Logs et Erreurs
```bash
# Vercel
vercel logs --follow

# Railway
railway logs --follow

# PM2
pm2 logs socialguard --lines 50
```

### Sauvegarde Supabase
- Sauvegarde automatique incluse (projet gratuit : 7 jours)
- Export manuel via Dashboard > Settings > Database

### Métriques de Performance
- Vercel Analytics (gratuit)
- Supabase Dashboard pour les requêtes DB
- Upstash Console pour Redis

## Résolution des Problèmes

### Erreurs Courantes

1. **"Invalid JWT token"**
   - Vérifier JWT_SECRET dans les variables d'environnement
   - Régénérer le secret si nécessaire

2. **"Supabase connection failed"**
   - Vérifier NEXT_PUBLIC_SUPABASE_URL
   - Vérifier les clés API Supabase

3. **"OAuth redirect mismatch"**
   - Ajouter l'URL de production dans Google Console
   - Mettre à jour les URLs dans Supabase Auth settings

4. **Build failures**
   - Vérifier les types TypeScript : `npm run type-check`
   - Vérifier les linter errors : `npm run lint`

### Performance

1. **Dashboard lent**
   - Vérifier les index DB (déjà optimisés)
   - Activer Redis cache
   - Réduire la taille de page (pagination)

2. **Quota Supabase dépassé**
   - Optimiser les requêtes
   - Migrer vers un plan payant
   - Implémenter la pagination agressive

### Sécurité

1. **RLS (Row Level Security)**
   - Testée automatiquement avec le schéma
   - Vérifier dans Supabase Dashboard > Authentication > Policies

2. **Variables d'environnement**
   - Ne jamais commiter les clés dans le code
   - Utiliser des secrets différents en production

## Scaling (Post-PMF)

### Passage au plan payant (>50€/mois)

1. **Supabase Pro** : 25$/mois
   - Plus de storage et bande passante
   - Support prioritaire

2. **Vercel Pro** : 20$/mois
   - Plus de déploiements
   - Analytics avancées

3. **APIs Premium**
   - OpenAI API : Pay-as-you-go
   - Claude API : Pay-as-you-go
   - Services de monitoring avancés

### Infrastructure élastique
- Kubernetes (auto-scaling)
- CDN CloudFlare
- Multiple régions

---

**Budget Total MVP** : 0€-10€/mois
**Budget Croissance** : 50€-100€/mois
**Budget Scale** : 200€-500€/mois

🎉 **Votre SocialGuard est maintenant déployé !**
