# 🔐 Configuration Google OAuth - Guide Détaillé

## 📌 C'est quoi Google OAuth ?

C'est le système qui permet à vos utilisateurs de se connecter avec leur compte Google (le bouton "Se connecter avec Google").

---

## 🎯 Étapes complètes

### Étape 1: Récupérer l'URL de redirection Supabase

**Avant de configurer Google, vous devez avoir cette URL:**

1. Allez sur votre projet Supabase: **[supabase.com/dashboard](https://supabase.com/dashboard)**
2. Cliquez sur **Authentication** dans le menu de gauche
3. Cliquez sur **Providers**
4. Trouvez **Google** dans la liste et cliquez dessus
5. Vous verrez une section **"Callback URL (for OAuth)"** qui contient une URL comme:
   ```
   https://votre-projet.supabase.co/auth/v1/callback
   ```
6. **📋 COPIEZ CETTE URL** - vous en aurez besoin plus tard

**Important:** Laissez cet onglet ouvert, on reviendra ici à la fin!

---

### Étape 2: Aller sur Google Cloud Console

1. Ouvrez un nouvel onglet
2. Allez sur **[console.cloud.google.com](https://console.cloud.google.com)**
3. Connectez-vous avec votre compte Google (celui que vous utilisez normalement)

---

### Étape 3: Créer un projet Google Cloud

**Si vous n'avez pas encore de projet:**

1. En haut de la page, vous verrez un menu déroulant avec le nom du projet
2. Cliquez dessus
3. Dans la fenêtre qui s'ouvre, cliquez sur **"NEW PROJECT"** (en haut à droite)
4. Remplissez:
   - **Project name**: `ProductivityHub` (ou ce que vous voulez)
   - **Location**: Laissez par défaut
5. Cliquez sur **"CREATE"**
6. Attendez quelques secondes que le projet soit créé
7. Sélectionnez votre nouveau projet dans le menu déroulant en haut

**Si vous avez déjà un projet:** Sélectionnez-le dans le menu déroulant

---

### Étape 4: Configurer l'écran de consentement OAuth

**C'est l'écran que les utilisateurs verront quand ils cliquent sur "Se connecter avec Google"**

1. Dans le menu de gauche (☰), allez dans:
   ```
   APIs & Services > OAuth consent screen
   ```

2. Choisissez **"External"** (pour que n'importe qui puisse se connecter)
3. Cliquez sur **"CREATE"**

4. **Page 1 - OAuth consent screen:**
   - **App name**: `ProductivityHub` (nom visible par les utilisateurs)
   - **User support email**: Votre email
   - **App logo**: (optionnel) vous pouvez ajouter un logo plus tard
   - **Developer contact information**: Votre email
   - Cliquez sur **"SAVE AND CONTINUE"**

5. **Page 2 - Scopes:**
   - Cliquez simplement sur **"SAVE AND CONTINUE"** (pas besoin d'ajouter de scopes)

6. **Page 3 - Test users:**
   - Si vous voulez tester avec des utilisateurs spécifiques, ajoutez leurs emails
   - Sinon, cliquez sur **"SAVE AND CONTINUE"**

7. **Page 4 - Summary:**
   - Vérifiez les informations
   - Cliquez sur **"BACK TO DASHBOARD"**

✅ L'écran de consentement est configuré!

---

### Étape 5: Créer les identifiants OAuth

**Maintenant on crée les clés secrètes pour Supabase:**

1. Dans le menu de gauche, allez dans:
   ```
   APIs & Services > Credentials
   ```

2. En haut de la page, cliquez sur **"+ CREATE CREDENTIALS"**

3. Dans le menu déroulant, choisissez **"OAuth client ID"**

4. Remplissez le formulaire:

   **Application type:**
   - Sélectionnez **"Web application"**

   **Name:**
   - Tapez: `ProductivityHub Web Client` (ou ce que vous voulez)

   **Authorized JavaScript origins:**
   - Cliquez sur **"+ ADD URI"**
   - Collez votre URL Supabase **sans** `/auth/v1/callback`:
     ```
     https://votre-projet.supabase.co
     ```
   - Exemple: Si votre URL de callback est `https://abcdefgh.supabase.co/auth/v1/callback`
     alors mettez: `https://abcdefgh.supabase.co`

   **Authorized redirect URIs:**
   - Cliquez sur **"+ ADD URI"**
   - Collez l'URL **COMPLÈTE** que vous avez copiée depuis Supabase (Étape 1):
     ```
     https://votre-projet.supabase.co/auth/v1/callback
     ```
   - ⚠️ **IMPORTANT:** Cette URL doit correspondre EXACTEMENT à celle de Supabase

5. Cliquez sur **"CREATE"**

---

### Étape 6: Récupérer les clés

**Une fenêtre pop-up apparaît avec vos clés:**

```
Your Client ID
xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com

Your Client Secret
GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**📋 COPIEZ CES DEUX VALEURS** - vous en aurez besoin tout de suite!

- **Client ID**: La longue chaîne qui finit par `.apps.googleusercontent.com`
- **Client secret**: La chaîne qui commence par `GOCSPX-`

Cliquez sur **"OK"**

---

### Étape 7: Retourner sur Supabase et coller les clés

1. Retournez sur l'onglet **Supabase** (Authentication > Providers > Google)

2. Activez le toggle **"Enable Sign in with Google"** si ce n'est pas déjà fait

3. Collez vos clés Google:
   - **Client ID**: Collez le Client ID que vous venez de copier
   - **Client Secret**: Collez le Client Secret

4. Cliquez sur **"Save"** en bas de la page

✅ **C'EST TERMINÉ!** 🎉

---

## 🧪 Tester la configuration

1. Assurez-vous que votre fichier `.env.local` contient vos clés Supabase:
   ```
   VITE_SUPABASE_URL=https://votre-projet.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbG...
   ```

2. Redémarrez votre application:
   ```bash
   npm run dev
   ```

3. Ouvrez l'app dans votre navigateur

4. Vous devriez voir l'écran de connexion avec le bouton "Se connecter avec Google"

5. Cliquez dessus:
   - Une fenêtre Google s'ouvre
   - Choisissez votre compte Google
   - Autorisez l'accès
   - Vous êtes redirigé vers l'app connecté! ✅

---

## 🐛 Problèmes courants

### ❌ Erreur "redirect_uri_mismatch"

**Cause:** L'URL de redirection dans Google Cloud Console ne correspond pas exactement à celle de Supabase

**Solution:**
1. Retournez sur Google Cloud Console > Credentials
2. Cliquez sur votre OAuth client ID
3. Vérifiez que **Authorized redirect URIs** contient EXACTEMENT:
   ```
   https://votre-projet.supabase.co/auth/v1/callback
   ```
4. Pas d'espace, pas de slash à la fin, doit être identique à Supabase
5. Cliquez sur "SAVE"
6. Attendez 5 minutes et réessayez

---

### ❌ Erreur "Access blocked: This app's request is invalid"

**Cause:** L'écran de consentement OAuth n'est pas correctement configuré

**Solution:**
1. Google Cloud Console > APIs & Services > OAuth consent screen
2. Vérifiez que:
   - App name est renseigné
   - User support email est renseigné
   - Developer contact information est renseigné
3. Si tout est bon, passez le statut en "Production":
   - En haut de la page, cliquez sur "PUBLISH APP"

---

### ❌ La fenêtre Google ne s'ouvre pas

**Cause:** Bloqueur de pop-up du navigateur

**Solution:**
1. Vérifiez que votre navigateur autorise les pop-ups pour votre site
2. Regardez dans la barre d'adresse s'il y a une icône de pop-up bloquée
3. Autorisez les pop-ups et réessayez

---

## 📝 Résumé visuel

```
┌─────────────────────────────────────────────────┐
│  1. Supabase: Copier Callback URL              │
│     https://xxx.supabase.co/auth/v1/callback   │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  2. Google Cloud Console                        │
│     - Créer projet                              │
│     - Configurer écran de consentement          │
│     - Créer OAuth Client ID                     │
│     - Ajouter Callback URL dans Redirect URIs  │
│     - Obtenir Client ID + Client Secret         │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  3. Retour sur Supabase                         │
│     - Coller Client ID                          │
│     - Coller Client Secret                      │
│     - Save                                      │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  4. Votre app                                   │
│     ✅ Connexion Google fonctionnelle!          │
└─────────────────────────────────────────────────┘
```

---

## 💡 Conseils

- **Gardez vos clés secrètes!** Ne les partagez jamais publiquement
- Le Client Secret doit rester dans Supabase uniquement
- Vous pouvez créer plusieurs OAuth clients (un pour dev, un pour prod)
- Si vous changez de domaine plus tard, ajoutez-le dans "Authorized redirect URIs"

---

Besoin d'aide ? Montrez-moi l'erreur que vous rencontrez! 👍
