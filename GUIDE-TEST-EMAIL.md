# 📧 Guide de Test - Service Email Resend

## ✅ **Migration SMTP2GO → Resend Terminée**

### **Avantages de Resend :**
- **3000 emails/mois gratuits** (vs 1000 avec SMTP2GO)
- **Taux de délivrabilité >99%** 
- **API moderne et simple**
- **Dashboard analytics inclus**
- **Support domaines personnalisés gratuit**

---

## 🚀 **Configuration Rapide**

### **1. Créer un compte Resend**
1. Aller sur [resend.com](https://resend.com/)
2. S'inscrire gratuitement 
3. Vérifier votre email

### **2. Générer une clé API**
1. Dans le dashboard Resend → API Keys
2. Créer une nouvelle clé
3. Copier la clé (elle commence par `re_`)

### **3. Configuration .env.local**
Ajouter dans votre `.env.local` :
```env
RESEND_API_KEY=re_your_api_key_here
```

---

## 🧪 **Tests Disponibles**

### **Test 1 : Via Dashboard (Recommandé)**
1. Aller sur **http://localhost:3000**
2. **"Accès démo"** → **Settings**
3. Section **"Test du Service Email"**
4. Saisir votre email → **"Envoyer un email de test"**
5. Vérifier votre boîte email

### **Test 2 : Via API Directe**
```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "votre@email.com"}'
```

### **Test 3 : Alerte Critique Simulée**
```bash
curl -X POST http://localhost:3000/api/monitoring/test-apis \
  -H "Content-Type: application/json" \
  -d '{"testEmail": "votre@email.com"}'
```

---

## 📊 **Monitoring du Service Email**

### **Dashboard Settings**
- **Quota utilisé** : X / 3000 emails ce mois
- **Statut connexion** : ✅ Connecté / ❌ Erreur
- **Prochaine réinitialisation** : Date du reset mensuel

### **Alertes Automatiques**
- **Critiques** : Envoi immédiat (sentiment ≤ -3)
- **Digest quotidien** : 8h du matin
- **Budget** : Alerte si >80% quota utilisé

---

## 🎯 **Types d'Emails Envoyés**

### **1. Email de Test**
```
Sujet: 🧪 Test SocialGuard - Configuration Email Resend
Contenu: Vérification que Resend fonctionne
```

### **2. Alerte Critique**
```
Sujet: 🚨 Mention critique détectée - SocialGuard
Contenu: Détails de la mention + lien dashboard
Priorité: Haute
```

### **3. Digest Quotidien**
```
Sujet: 📊 Résumé quotidien SocialGuard - X mentions
Contenu: Statistiques + top keywords
Priorité: Normale
```

### **4. Pic de Volume**
```
Sujet: 📈 Pic de mentions détecté (+X%) - SocialGuard  
Contenu: Volume actuel vs précédent
Priorité: Normale
```

---

## 🔧 **Troubleshooting**

### **Erreurs Communes**

**"Service email non configuré"**
- ✅ Vérifier `RESEND_API_KEY` dans `.env.local`
- ✅ Redémarrer le serveur : `npm run dev`

**"Quota mensuel dépassé"**
- ✅ Attendre le reset mensuel
- ✅ Upgrade Resend si nécessaire

**"Domaine non vérifié"**
- ⚠️ Emails peuvent finir en spam
- ✅ Vérifier domaine sur Resend dashboard

**"Erreur de délivrabilité"**
- ✅ Vérifier logs Resend dashboard
- ✅ Configurer SPF/DKIM si domaine custom

---

## 📈 **Limites et Scaling**

### **Free Tier Resend**
- ✅ **3000 emails/mois**
- ✅ **Domaine vérifié gratuit**
- ✅ **Analytics de base**
- ✅ **Support standard**

### **Upgrade Pro (25$/mois)**
- ✅ **50 000 emails/mois**
- ✅ **Domaines illimités** 
- ✅ **Analytics avancées**
- ✅ **Support prioritaire**
- ✅ **Webhooks**

---

## ✅ **Checklist de Validation**

Tester ces étapes pour valider Resend :

- [ ] **.env.local** configuré avec `RESEND_API_KEY`
- [ ] **Dashboard → Settings** : Status email "✅ Connecté"
- [ ] **Test manuel** : Email reçu dans boîte
- [ ] **Headers corrects** : From SocialGuard, priorité OK
- [ ] **HTML rendu** : Email stylé et lisible
- [ ] **Quota affiché** : X / 3000 dans dashboard

---

## 🎊 **Résultat**

**Service email Resend opérationnel pour :**
- ✅ **Alertes critiques** temps réel
- ✅ **Digest quotidien** automatique  
- ✅ **Tests de configuration** 
- ✅ **3000 emails/mois gratuits**
- ✅ **Délivrabilité excellente**

**SocialGuard peut maintenant envoyer des alertes email fiables ! 📧**
