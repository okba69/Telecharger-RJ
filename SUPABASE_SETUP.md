# 🚀 Configuration Supabase pour ProductivityHub

## 🎯 Configuration Simple (5 minutes)

Votre app utilise maintenant une **connexion magique par email** (pas de mot de passe à retenir!).
Vous recevez un email, vous cliquez sur le lien, et vous êtes connecté. C'est tout! ✨

---

## 📋 Étapes de configuration

### 1️⃣ Créer un compte et un projet Supabase (GRATUIT)

1. Allez sur **[supabase.com](https://supabase.com)**
2. Cliquez sur **"Start your project"**
3. Connectez-vous avec GitHub (ou créez un compte)
4. Cliquez sur **"New Project"**
5. Remplissez:
   - **Name**: `ProductivityHub`
   - **Database Password**: Générez un mot de passe fort (vous n'en aurez plus besoin après)
   - **Region**: Choisissez proche de vous (ex: **Europe West - Paris**)
6. Cliquez sur **"Create new project"**
7. ⏳ Attendez 1-2 minutes que le projet soit prêt

---

### 2️⃣ Créer la table de données

1. Dans le menu de gauche, cliquez sur **SQL Editor** (📝)
2. Cliquez sur **"New query"**
3. Copiez-collez ce code SQL:

```sql
-- Créer la table user_data pour stocker les données synchronisées
CREATE TABLE user_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data_key TEXT NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, data_key)
);

-- Activer Row Level Security (sécurité)
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent lire leurs propres données
CREATE POLICY "Users can read their own data"
  ON user_data
  FOR SELECT
  USING (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent insérer leurs propres données
CREATE POLICY "Users can insert their own data"
  ON user_data
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent mettre à jour leurs propres données
CREATE POLICY "Users can update their own data"
  ON user_data
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent supprimer leurs propres données
CREATE POLICY "Users can delete their own data"
  ON user_data
  FOR DELETE
  USING (auth.uid() = user_id);

-- Activer les modifications en temps réel
ALTER PUBLICATION supabase_realtime ADD TABLE user_data;
```

4. Cliquez sur **"Run"** (ou Ctrl+Enter)
5. ✅ Vous devriez voir "Success. No rows returned"

---

### 3️⃣ Récupérer vos clés API

1. Dans le menu de gauche, cliquez sur **Settings** (⚙️)
2. Cliquez sur **API**
3. Vous verrez deux valeurs importantes:

```
Project URL
https://xxxxxxxxxxxxx.supabase.co

anon public
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZi...
```

📋 **Copiez ces 2 valeurs** (on va les utiliser juste après)

---

### 4️⃣ Configurer votre projet local

1. Ouvrez un terminal à la racine de votre projet

2. Copiez le fichier exemple:
```bash
cp .env.local.example .env.local
```

3. Ouvrez le fichier `.env.local` avec un éditeur de texte

4. Remplacez par vos **vraies valeurs**:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

5. Sauvegardez le fichier

6. Redémarrez votre serveur de développement:
```bash
npm run dev
```

---

## ✅ C'est prêt !

Rechargez votre application. Vous devriez maintenant voir:

1. ✅ Un écran de connexion avec un champ email
2. ✅ Entrez votre email
3. ✅ Vous recevez un email avec un lien magique
4. ✅ Cliquez sur le lien → Vous êtes connecté!
5. ✅ Vos données localStorage sont automatiquement migrées vers Supabase

---

## 📱 Utilisation multi-appareils

**Comment ça marche:**

1. **PC 1**:
   - Connectez-vous avec votre email (ex: `moi@gmail.com`)
   - Créez des tâches, ajoutez des items "à faire", etc.

2. **PC 2**:
   - Ouvrez l'app
   - Connectez-vous avec le **même email** (`moi@gmail.com`)
   - 🎉 Toutes vos données apparaissent automatiquement!

3. **Synchronisation temps réel**:
   - Modification sur PC 1 → Apparaît instantanément sur PC 2
   - Et vice-versa!

---

## 🔒 Sécurité

- ✅ `.env.local` est dans `.gitignore` (vos clés ne seront jamais publiées)
- ✅ **Row Level Security (RLS)**: Chaque utilisateur ne peut voir que ses propres données
- ✅ **Magic Link**: Pas de mot de passe à retenir (lien valide 1 heure)
- ✅ Connexion HTTPS chiffrée
- ✅ Email de confirmation à chaque connexion

---

## 🆓 Plan gratuit Supabase

Le plan gratuit inclut:

- ✅ **500 MB** de base de données
- ✅ **1 GB** de bande passante par mois
- ✅ **50,000** utilisateurs actifs mensuels
- ✅ Synchronisation temps réel illimitée
- ✅ Authentification illimitée
- ✅ Support communautaire

**Largement suffisant pour un usage personnel!**

---

## 🐛 Dépannage

### ❌ Erreur "Invalid API key"

**Solution:**
- Vérifiez que vous avez bien copié la clé **anon public** (pas la clé service_role)
- Assurez-vous qu'il n'y a pas d'espace avant ou après les valeurs dans `.env.local`
- Redémarrez le serveur de développement (`npm run dev`)

---

### ❌ "Je ne reçois pas l'email"

**Solutions:**
1. Vérifiez vos **spams/courrier indésirable**
2. Dans Supabase, allez dans **Authentication > Email Templates** et vérifiez que les emails sont activés
3. Attendez 1-2 minutes (parfois l'email prend du temps)
4. Essayez avec un autre email (Gmail, Outlook, etc.)

**Note:** Par défaut, Supabase envoie 3 emails maximum par heure pour un même email (protection anti-spam)

---

### ❌ "Table user_data does not exist"

**Solution:**
- Retournez à l'étape 2
- Assurez-vous d'avoir bien exécuté le code SQL dans l'éditeur SQL
- Vérifiez dans **Table Editor** que la table `user_data` existe

---

### ❌ Les données ne se synchronisent pas entre PC

**Solutions:**
1. Vérifiez que vous êtes connecté avec le **même email** sur les deux PC
2. Ouvrez la console développeur (F12) et regardez les erreurs
3. Vérifiez que les politiques RLS sont bien créées (étape 2)
4. Attendez quelques secondes (la sync peut prendre 1-2 secondes)

---

## 💡 Astuces

### Comment me déconnecter ?

Cliquez sur le bouton **"Déconnexion"** en haut à droite de l'app (visible uniquement si Supabase est configuré)

### Comment changer d'email ?

1. Déconnectez-vous
2. Reconnectez-vous avec le nouvel email
3. Vos anciennes données restent liées à l'ancien email

### Est-ce que mes données sont en sécurité ?

Oui!
- Vos données sont stockées sur les serveurs sécurisés de Supabase (AWS)
- Personne ne peut accéder à vos données sauf vous
- Les règles de sécurité (RLS) empêchent tout accès non autorisé
- Toutes les connexions sont chiffrées (HTTPS)

### Puis-je exporter mes données ?

Oui! Dans Supabase:
1. Allez dans **Table Editor** → **user_data**
2. Filtrez par votre `user_id`
3. Cliquez sur **Export** pour télécharger en CSV ou JSON

---

## 🎨 Personnalisation avancée (optionnel)

### Changer le texte de l'email de connexion

1. Dans Supabase: **Authentication** → **Email Templates**
2. Sélectionnez **Magic Link**
3. Personnalisez le texte, la couleur, le logo
4. Cliquez sur **Save**

### Ajouter un domaine personnalisé

Si vous déployez sur votre propre domaine (ex: `monapp.com`):
1. Dans Supabase: **Authentication** → **URL Configuration**
2. Ajoutez votre domaine dans **Redirect URLs**
3. Mettez à jour `emailRedirectTo` dans le code

---

## 📞 Support

Besoin d'aide supplémentaire ?

- 📖 [Documentation Supabase](https://supabase.com/docs)
- 💬 [Discord Supabase](https://discord.supabase.com)
- 🐛 Ouvrez une issue sur GitHub

---

## 📊 Résumé de la configuration

```
1. Créer projet Supabase          ✓ (2 min)
   └─ supabase.com

2. Créer table user_data           ✓ (1 min)
   └─ SQL Editor > Copier-coller le SQL

3. Récupérer les clés              ✓ (30 sec)
   └─ Settings > API
      ├─ Project URL
      └─ anon public key

4. Créer .env.local                ✓ (1 min)
   └─ Coller les 2 clés

5. Redémarrer l'app                ✓ (30 sec)
   └─ npm run dev

TOTAL: ~5 minutes
```

---

Vous êtes prêt! 🚀 Votre ProductivityHub est maintenant synchronisé dans le cloud!
