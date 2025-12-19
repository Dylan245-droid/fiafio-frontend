# Fiafio Frontend

> **Application mobile-first de paiement avec interface agent et utilisateur**

## 🚀 Stack Technique

- **Framework**: React 18 + TypeScript
- **Build**: Vite
- **Styling**: TailwindCSS
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **State**: React Context (AuthContext)

---

## 📱 Pages Principales

### Authentification
| Page | Route | Description |
|------|-------|-------------|
| `LoginPage` | `/login` | Connexion utilisateur |
| `RegisterPage` | `/register` | Inscription |

### Utilisateur Standard
| Page | Route | Description |
|------|-------|-------------|
| `Dashboard` | `/dashboard` | Tableau de bord utilisateur |
| `TransferPage` | `/transfer` | Effectuer un transfert P2P |
| `DepositPage` | `/deposit` | Demander un dépôt |
| `CashInPage` | `/cash-in` | Top-up mobile money |
| `TopUpPage` | `/topup` | Recharge via checkout |
| `Transactions` | `/transactions` | Historique des transactions |

### Agent
| Page | Route | Description |
|------|-------|-------------|
| `AgentDashboard` | `/agent-dashboard` | Dashboard agent complet |
| `AgentDashboardPage` | `/agent` | Opérations agent (dépôt/retrait) |
| `FloatRequestPage` | `/float-request` | Demande de recharge float |
| `QrWithdrawPage` | `/qr-withdraw` | Retrait via QR code scanné |

### Administration
| Page | Route | Description |
|------|-------|-------------|
| `AdminConsole` | `/admin` | Console d'administration |

---

## 👤 Système d'Agent (Dashboard)

### Carte Volume du Jour
- **Volume actuel** : Montant total des transactions du jour
- **Barre de progression** : Visuelle avec code couleur
  - 🔵 Bleu (< 70%) : Normal
  - 🟡 Jaune (70-90%) : Attention
  - 🔴 Rouge (> 90%) : Limite proche
- **Super Agent** : Affiche "∞ Illimité" sans barre

### Niveaux d'Agent
| Niveau | Badge | Transactions Requises | Limite Jour |
|--------|-------|----------------------|-------------|
| Nouvel Agent | 🆕 | 0 | 2 000 000 XAF |
| Agent Confirmé | ✅ | 15 | 5 000 000 XAF |
| Agent Vérifié | ⭐ | 100 | 15 000 000 XAF |
| Super Agent | 🏆 | 500 | ∞ Illimité |

**Important** : La progression est **automatique** et basée uniquement sur le nombre de transactions. Pas besoin d'attendre un nombre de jours.

### Actions Agent
1. **Dépôt (Cash-In)** : Recevoir espèces, créditer le client
2. **Retrait (Cash-Out)** : Donner espèces, débiter le client (frais 2%)
3. **QR Code Retrait** : Le client scanne pour initier un retrait
4. **Demande Float** : Demander une recharge de float

---

## 🔐 Authentification

Le contexte `AuthContext` gère :
- **Token JWT** stocké en localStorage
- **Utilisateur courant** avec rôle (`USER`, `AGENT`, `ADMIN`)
- **Auto-login** au démarrage si token valide

```tsx
const { user, login, logout, isAuthenticated } = useAuth();
```

---

## 🌐 API Service

Toutes les requêtes passent par `services/api.ts` :

```typescript
import api from '../services/api';

// Exemple
const response = await api.get('/accounts/balance');
const balance = response.data.accounts;
```

Configuration automatique :
- Base URL vers le backend
- Intercepteur JWT (ajoute le token à chaque requête)
- Gestion des erreurs 401 (déconnexion automatique)

---

## 📁 Structure du Projet

```
frontend/
├── src/
│   ├── components/         # Composants réutilisables
│   │   ├── TransactionModal.tsx
│   │   └── AgentStatsCard.tsx
│   ├── context/
│   │   └── AuthContext.tsx # Gestion auth globale
│   ├── pages/              # Pages de l'application
│   │   ├── Dashboard.tsx
│   │   ├── AgentDashboard.tsx
│   │   ├── AdminConsole.tsx
│   │   └── ...
│   ├── services/
│   │   └── api.ts          # Client HTTP Axios
│   ├── App.tsx             # Routes principales
│   └── main.tsx            # Point d'entrée
├── public/
├── tailwind.config.js
└── package.json
```

---

## 🎨 Design System

### Couleurs Principales
- **Primary** : Vert Fiafio (`#22C55E`)
- **Background** : Noir profond (`#0A0A0A`)
- **Surface** : Gris foncé (`#1A1A1A`)

### Composants UI
- Cartes arrondies (`rounded-2xl`, `rounded-3xl`)
- Gradients subtils
- Transitions douces
- Design mobile-first

---

## 🔧 Commandes

```bash
# Installation
npm install

# Développement (hot reload)
npm run dev

# Build production
npm run build

# Preview build
npm run preview

# Lint
npm run lint
```

---

## 🔗 Variables d'Environnement

```env
VITE_API_URL=http://localhost:3333/api
```

Pour la production, configurer l'URL du backend déployé.
