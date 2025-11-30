# Development Guide

## Project Architecture

This application follows a scalable architecture pattern with clear separation of concerns:

### Folder Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication-related components
│   └── layout/         # Layout components (Header, Sidebar, MainLayout)
├── pages/              # Page components (route-level components)
├── services/           # API services and external integrations
├── store/              # Zustand state management stores
├── types/              # TypeScript type definitions
├── utils/              # Utility functions and helpers
├── App.tsx             # Main application component with routing
└── main.tsx            # Application entry point
```

## State Management with Zustand

### Creating a New Store

1. Create a new file in `src/store/`:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface YourState {
  data: any[];
  isLoading: boolean;
  fetchData: () => Promise<void>;
}

export const useYourStore = create<YourState>()(
  persist(
    (set) => ({
      data: [],
      isLoading: false,
      fetchData: async () => {
        set({ isLoading: true });
        // Fetch data logic
        set({ isLoading: false });
      },
    }),
    {
      name: 'your-storage-key', // localStorage key
    }
  )
);
```

2. Use the store in components:

```typescript
import { useYourStore } from '../store/yourStore';

const YourComponent = () => {
  const { data, fetchData } = useYourStore();
  // Component logic
};
```

## Adding New Routes

### Step 1: Create a Page Component

Create a new file in `src/pages/`:

```typescript
import React from 'react';

const NewPage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">New Page</h1>
      <div className="bg-white rounded-lg shadow p-6">
        {/* Your content */}
      </div>
    </div>
  );
};

export default NewPage;
```

### Step 2: Add Route to App.tsx

```typescript
import NewPage from './pages/NewPage';

// In the Routes component, add:
<Route path="new-page" element={<NewPage />} />
```

### Step 3: Add Navigation Item

Update `src/components/layout/Sidebar.tsx`:

```typescript
const navItems: NavItem[] = [
  // ... existing items
  { name: 'New Page', path: '/new-page', icon: '📄' },
];
```

## API Integration

### Creating a New Service

1. Create a service file in `src/services/`:

```typescript
import { apiClient } from './api';

export const yourService = {
  getAll: async () => {
    const response = await apiClient.get('/your-endpoint');
    return response.data;
  },

  create: async (data: any) => {
    const response = await apiClient.post('/your-endpoint', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/your-endpoint/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/your-endpoint/${id}`);
    return response.data;
  },
};
```

### Using the Service with State

```typescript
import { create } from 'zustand';
import { yourService } from '../services/yourService';

export const useYourStore = create((set) => ({
  items: [],
  loading: false,
  error: null,

  fetchItems: async () => {
    set({ loading: true, error: null });
    try {
      const items = await yourService.getAll();
      set({ items, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
}));
```

## Styling with Tailwind CSS

### Common Patterns

**Card Component:**
```tsx
<div className="bg-white rounded-lg shadow-md p-6">
  {/* Content */}
</div>
```

**Button Variants:**
```tsx
// Primary
<button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
  Primary
</button>

// Secondary
<button className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">
  Secondary
</button>

// Danger
<button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
  Delete
</button>
```

**Form Input:**
```tsx
<input
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
/>
```

**Grid Layout:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Grid items */}
</div>
```

## TypeScript Best Practices

### Define Types

Create types in `src/types/`:

```typescript
export interface YourModel {
  id: string;
  name: string;
  createdAt: string;
}

export interface YourApiResponse {
  data: YourModel[];
  total: number;
  page: number;
}
```

### Use Type Imports

```typescript
import type { YourModel } from '../types';
```

## Environment Variables

Create `.env` file in the project root:

```
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=My App
```

Access in code:

```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

## Development Workflow

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Type checking:**
   ```bash
   npm run type-check
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Preview production build:**
   ```bash
   npm run preview
   ```

## Testing the Auth Flow

Make sure your backend server is running and the `VITE_API_URL` in your `.env` file points to the correct endpoint.

Test the authentication:
1. Start your backend server
2. Start the frontend dev server: `npm run dev`
3. Navigate to `http://localhost:5173`
4. Try registering a new user or logging in with existing credentials

## Common Issues and Solutions

### Issue: Tailwind styles not working
- Make sure `tailwind.config.js` and `postcss.config.js` are properly configured
- Restart the dev server after changing Tailwind config

### Issue: API calls failing
- Check the `VITE_API_URL` in `.env`
- Verify the backend is running
- Check browser console for CORS errors

### Issue: Auth not persisting
- Check localStorage in browser DevTools
- Verify Zustand persist middleware is configured

## Performance Optimization

### Code Splitting

Use React.lazy for route-based code splitting:

```typescript
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));

<Suspense fallback={<LoadingSpinner />}>
  <Route path="dashboard" element={<DashboardPage />} />
</Suspense>
```

### Memoization

Use React.memo for expensive components:

```typescript
export default React.memo(YourComponent);
```

## Deployment

### Build the app:
```bash
npm run build
```

The built files will be in the `dist/` folder, ready to deploy to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static hosting service

### Environment Variables for Production

Make sure to set these in your hosting platform:
- `VITE_API_URL` - Your production API URL
