# React TypeScript App with JWT Authentication

A modern, scalable React TypeScript application with JWT authentication, featuring vertical (sidebar) and horizontal (header) navigation bars.

## Features

- 🔐 JWT-based authentication (Login/Register)
- 🎨 Modern UI with Tailwind CSS
- 📱 Responsive design
- 🗂️ Vertical sidebar navigation (collapsible)
- 🔝 Horizontal header navigation
- 🏪 Zustand for state management
- 🔄 React Router for routing
- 🛡️ Protected routes
- 📡 Axios with interceptors for API calls
- 🎯 TypeScript for type safety

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **React Router v6** - Routing
- **Axios** - HTTP client
- **JWT Decode** - Token handling

## Project Structure

```
src/
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.tsx    # Route protection wrapper
│   └── layout/
│       ├── Header.tsx             # Horizontal navigation
│       ├── Sidebar.tsx            # Vertical navigation
│       └── MainLayout.tsx         # Main layout wrapper
├── pages/
│   ├── LoginPage.tsx              # Login page
│   ├── RegisterPage.tsx           # Registration page
│   ├── DashboardPage.tsx          # Dashboard
│   ├── ProfilePage.tsx            # Profile page
│   ├── SettingsPage.tsx           # Settings page
│   ├── AnalyticsPage.tsx          # Analytics page
│   └── ReportsPage.tsx            # Reports page
├── services/
│   ├── api.ts                     # Axios instance & interceptors
│   └── authService.ts             # Authentication API calls
├── store/
│   └── authStore.ts               # Zustand auth store
├── types/
│   └── index.ts                   # TypeScript interfaces
├── utils/                         # Utility functions
├── App.tsx                        # Main app component
└── main.tsx                       # Entry point
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Clone the repository and navigate to the client folder

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Update the `.env` file with your API URL:
```
VITE_API_URL=http://localhost:3000/api
```

### Development

Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Authentication Flow

1. **Login/Register**: Users authenticate via the login or register page
2. **JWT Token**: Upon successful authentication, a JWT token is stored
3. **Persistent State**: Auth state is persisted using Zustand's persist middleware
4. **Protected Routes**: All main app routes are protected and redirect to login if not authenticated
5. **API Interceptors**: Axios automatically adds the JWT token to all API requests
6. **Auto Logout**: If the API returns a 401 error, the user is automatically logged out

## API Integration

The app expects a backend API with the following endpoints:

### Auth Endpoints
- `POST /api/auth/login` - Login with email and password
- `POST /api/auth/register` - Register a new user
- `GET /api/auth/me` - Get current user details
- `POST /api/auth/refresh` - Refresh JWT token

### Expected Response Format

**Login/Register Response:**
```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "user"
  }
}
```

## Backend Integration

### Required Environment Variables

Create a `.env` file in the project root:

```
VITE_API_URL=http://your-backend-url/api
```

### Expected API Endpoints

Your backend should implement these endpoints:

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`
- `POST /api/auth/refresh`

## Customization

### Adding New Routes

1. Create a new page component in `src/pages/`
2. Add the route to `src/App.tsx`
3. Add navigation item to `src/components/layout/Sidebar.tsx`

### Styling

The app uses Tailwind CSS. You can customize:
- Colors and theme in `tailwind.config.js`
- Global styles in `src/index.css`

### State Management

To add new stores:
1. Create a new store file in `src/store/`
2. Follow the Zustand pattern used in `authStore.ts`

## License

MIT
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
