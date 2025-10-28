# 🚀 Configuration Supabase pour ProductivityHub

## Pourquoi Supabase ?

- **Open Source** et gratuit pour commencer
- **PostgreSQL** en backend (base de données relationnelle standard)
- **Synchronisation temps réel** automatique
- **Authentification Google** intégrée
- **Dashboard simple** et intuitif

---

## 📋 Étapes de configuration (5 minutes)

### 1️⃣ Créer un compte et un projet Supabase

1. Allez sur **[supabase.com](https://supabase.com)**
2. Cliquez sur **"Start your project"**
3. Connectez-vous avec GitHub (ou créez un compte)
4. Cliquez sur **"New Project"**
5. Remplissez:
   - **Name**: `ProductivityHub`
   - **Database Password**: Générez un mot de passe fort (notez-le)
   - **Region**: Choisissez proche de vous (ex: Europe West - Paris)
6. Cliquez sur **"Create new project"**
7. ⏳ Attendez 1-2 minutes que le projet soit prêt

### 2️⃣ Activer l'authentification Google

1. Dans le menu de gauche, cliquez sur **Authentication** (🔐)
2. Cliquez sur **"Providers"**
3. Trouvez **Google** dans la liste
4. Activez le toggle **"Enable Sign in with Google"**
5. Suivez les instructions pour configurer OAuth:
   - Allez sur [Google Cloud Console](https://console.cloud.google.com)
   - Créez un nouveau projet ou utilisez un existant
   - Allez dans **APIs & Services > Credentials**
   - Cliquez sur **"Create Credentials" > "OAuth 2.0 Client ID"**
   - Configurez l'écran de consentement si demandé
   - Type d'application: **Web application**
   - **Authorized redirect URIs**: Copiez l'URL fournie par Supabase (format: `https://votre-projet.supabase.co/auth/v1/callback`)
   - Cliquez sur **"Create"**
   - Copiez le **Client ID** et **Client Secret**
6. Retournez sur Supabase et collez:
   - **Google Client ID**
   - **Google Client Secret**
7. Cliquez sur **"Save"**

### 3️⃣ Créer la table de données

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

### 4️⃣ Récupérer les clés API

1. Dans le menu de gauche, cliquez sur **Settings** (⚙️)
2. Cliquez sur **API**
3. Vous verrez:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

📋 **Copiez ces 2 valeurs** (gardez-les à portée de main)

### 5️⃣ Configurer votre projet local

1. Ouvrez un terminal à la racine de votre projet
2. Copiez le fichier exemple:

```bash
cp .env.local.example .env.local
```

3. Ouvrez `.env.local` et remplacez par vos vraies valeurs:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

4. Redémarrez votre serveur de développement:

```bash
npm run dev
```

---

## ✅ C'est prêt !

Rechargez votre application. Vous devriez maintenant voir:
- ✅ Un écran de connexion avec le bouton Google
- ✅ Après connexion, vos données localStorage sont automatiquement migrées vers Supabase
- ✅ Toutes les modifications se synchronisent en temps réel

---

## 📱 Utilisation multi-appareils

1. **PC 1**: Connectez-vous avec votre compte Google
2. **PC 1**: Créez des tâches, ajoutez des items "à faire", etc.
3. **PC 2**: Ouvrez l'app et connectez-vous avec le **même compte Google**
4. **PC 2**: 🎉 Toutes vos données apparaissent automatiquement!

Les modifications sur PC 1 apparaissent **instantanément** sur PC 2 et vice-versa.

---

## 🔒 Sécurité

- ✅ `.env.local` est dans `.gitignore` (vos clés ne seront jamais publiées)
- ✅ Row Level Security (RLS) activé: chaque utilisateur ne peut voir que ses propres données
- ✅ Authentification Google sécurisée
- ✅ Connexion HTTPS chiffrée

---

## 🆓 Plan gratuit Supabase

Le plan gratuit inclut:
- ✅ 500 MB de base de données
- ✅ 1 GB de bande passante
- ✅ 50,000 utilisateurs actifs mensuels
- ✅ Synchronisation temps réel
- ✅ Authentification illimitée

**Largement suffisant pour un usage personnel !**

---

## 🐛 Dépannage

### Erreur "Invalid API key"
➜ Vérifiez que vous avez bien copié la clé **anon public** (pas la clé service_role)

### Erreur "User not found"
➜ Vérifiez que l'authentification Google est bien activée dans Supabase

### Les données ne se synchronisent pas
➜ Vérifiez que la table `user_data` existe et que les politiques RLS sont activées

### Erreur lors de la connexion Google
➜ Vérifiez que l'URL de redirection OAuth dans Google Cloud Console correspond exactement à celle fournie par Supabase

---

## 📞 Support

Besoin d'aide ? Consultez la [documentation Supabase](https://supabase.com/docs) ou ouvrez une issue sur GitHub.
