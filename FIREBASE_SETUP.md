# 🔥 Configuration Firebase pour ProductivityHub

## 📋 Étapes de configuration

### 1. Créer un projet Firebase

1. Allez sur [console.firebase.google.com](https://console.firebase.google.com)
2. Cliquez sur "Ajouter un projet"
3. Donnez un nom (ex: "ProductivityHub")
4. Désactivez Google Analytics (optionnel)
5. Cliquez sur "Créer un projet"

### 2. Activer l'authentification

1. Dans la console Firebase, allez dans **Authentication** (menu de gauche)
2. Cliquez sur "Commencer"
3. Allez dans l'onglet **"Sign-in method"**
4. Activez **"Google"**:
   - Cliquez sur "Google"
   - Activez le bouton
   - Choisissez un email de support
   - Enregistrez

### 3. Créer une application web

1. Dans **Paramètres du projet** (icône engrenage en haut à gauche)
2. Scrollez jusqu'à "Vos applications"
3. Cliquez sur l'icône **</>** (Web)
4. Donnez un nom (ex: "ProductivityHub Web")
5. Cochez "Configurer aussi Firebase Hosting" si vous voulez
6. Cliquez sur "Enregistrer l'application"

### 4. Copier les clés de configuration

Vous verrez un code comme celui-ci:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "votre-projet.firebaseapp.com",
  projectId: "votre-projet",
  storageBucket: "votre-projet.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### 5. Créer le fichier .env.local

1. Copiez le fichier `.env.local.example` en `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Ouvrez `.env.local` et remplacez les valeurs:

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=votre-projet
VITE_FIREBASE_STORAGE_BUCKET=votre-projet.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 6. Activer Firestore Database

1. Dans la console Firebase, allez dans **Firestore Database**
2. Cliquez sur "Créer une base de données"
3. Choisissez **"Démarrer en mode test"** (pour commencer)
4. Choisissez une localisation (ex: europe-west1)
5. Cliquez sur "Activer"

⚠️ **Important**: En mode test, les données sont accessibles pendant 30 jours. Après vos tests, configurez les règles de sécurité.

### 7. Configurer les règles de sécurité Firestore

Allez dans l'onglet **"Règles"** de Firestore et remplacez par:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Seul l'utilisateur connecté peut accéder à ses données
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 8. Redémarrer le serveur de développement

```bash
npm run dev
```

## ✅ C'est prêt!

Votre ProductivityHub est maintenant connecté à Firebase. Vos données seront synchronisées entre tous vos appareils! 🎉

## 🔒 Sécurité

- ✅ `.env.local` est dans `.gitignore` (vos clés ne seront pas publiées sur GitHub)
- ✅ Les règles Firestore empêchent les autres utilisateurs d'accéder à vos données
- ✅ Seules les personnes connectées avec leur compte Google peuvent utiliser l'app

## 📱 Utilisation multi-appareils

1. Sur votre PC 1: Connectez-vous avec votre compte Google
2. Créez des tâches, des items "à faire", etc.
3. Sur votre PC 2: Ouvrez l'app et connectez-vous avec le **même compte Google**
4. Toutes vos données apparaissent automatiquement! 🚀

## ⚠️ Notes importantes

- Les données en localStorage local seront migrées vers Firebase lors de la première connexion
- Après migration, toutes les modifications se synchronisent en temps réel
- Si vous vous déconnectez, vos données restent dans le cloud
