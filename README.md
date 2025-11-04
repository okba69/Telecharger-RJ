# ProducHub

Application React de gestion de productivité personnelle pour ingénieurs et professionnels.

## Fonctionnalités

### Onglet "Aujourd'hui" (3 colonnes)

#### A. Planifier
- **Objectifs du jour** : Définissez vos objectifs avec critères de succès
- **Inbox rapide** : Notez à la volée les demandes qui arrivent

#### B. Exécuter
- **Gestion des tâches** :
  - Créer des tâches avec titre, description et estimation
  - Statuts : À faire, En cours, Terminé
  - Chronomètre en temps réel pour la tâche active
  - Boutons Pause / Reprendre / Terminé
  - Notes de blocage pour chaque tâche
- **Mode Focus** : Concentration sur une seule tâche

#### C. Bilan du jour
- **KPIs automatiques** :
  - Nombre de tâches terminées
  - Temps productif total
  - Écart moyen Estimé vs Réel (en %)
  - Liste des blocages rencontrés
- **Feedback personnel** :
  - Zone de texte libre pour notes de fin de journée
  - Sliders Énergie/Focus (0-10)
  - Slider Satisfaction (0-10)

### Autres Onglets
- **Analyse** : Tendances et graphiques (à venir)
- **Historique** : Archive des journées passées (à venir)
- **Paramètres** : Configuration personnalisée (à venir)

## Installation

```bash
npm install
```

## Lancement

```bash
npm run dev
```

Ouvrez [http://localhost:5173](http://localhost:5173) dans votre navigateur.

## Build pour production

```bash
npm run build
```

## Technologies

- **React 18** avec hooks (useState, useEffect, useRef)
- **Vite** pour le bundler
- **TailwindCSS** pour le style (dark UI)
- Données en mémoire (préparé pour localStorage)

## Architecture

- `TaskCoachApp.jsx` : Composant principal contenant toute la logique
- Gestion du state pour les tâches, chronomètre, objectifs, inbox
- Timer basé sur useEffect + setInterval pour précision

## Prochaines évolutions

- Persistance localStorage
- Graphiques de tendances
- Historique complet
- Export PDF/JSON/CSV
- Mode Pomodoro
- Notifications et rappels
- Intégrations calendrier

## Développeur

Application créée avec Claude Code pour optimiser la productivité au quotidien.
