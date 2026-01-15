# AGENTS.md - Coding Agent Guide

This guide provides essential information for AI coding agents working in this Next.js frontend codebase.

## Build, Lint & Test Commands

### Development

```bash
npm run dev              # Start dev server with Turbopack (http://localhost:3000)
npm run build            # Production build with Turbopack
npm start                # Start production server
npm run lint             # Run ESLint
npm run codegen          # Generate API client from OpenAPI spec using Orval
```

### Running Tests

⚠️ **No test suite is currently configured.** When adding tests:

- Use Jest with React Testing Library (recommended)
- Place test files as `*.test.ts(x)` or `*.spec.ts(x)` next to source files
- Run single test: `npm test -- path/to/test.test.tsx`

## Project Architecture: Feature-Sliced Design (FSD)

The codebase follows **Feature-Sliced Design** principles with strict layer dependencies:

```
app/         → Next.js App Router pages & layouts
page/        → Page-level components (presentation layer)
widgets/     → Composite UI blocks (header, sidebar, content-grid)
features/    → Business logic features (auth, search, editor)
entities/    → Business entities (note, web-article)
shared/      → Reusable infrastructure (components, services, utils)
```

**Dependency Rules** (import only from layers below):

- ✅ `features/` → `entities/`, `shared/`
- ✅ `entities/` → `shared/`
- ✅ `page/`, `widgets/` → `features/`, `entities/`, `shared/`
- ❌ No circular dependencies between layers

## Code Style Guidelines

### 1. Import Organization

```typescript
// 1. External libraries
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

// 2. Internal modules with @/ alias (absolute imports)
import { Button } from "@/shared/components/ui/button";
import { useAuthStore } from "@/features/auth";
import { getMe } from "@/shared/services/generated/api";

// 3. Relative imports (within same feature/entity only)
import { useLogin } from "../api/useLogin";

// 4. Types and interfaces
import type { User } from "@/shared/services/generated/api";
```

**Path Alias**: Always use `@/*` for cross-layer imports (mapped to root in `tsconfig.json`)

### 2. TypeScript Conventions

```typescript
// Use TypeScript strict mode (enabled in tsconfig)
type AuthState = {
  isAuth: boolean | null;
  user: User | null;
};

type AuthAction = {
  login: () => void;
  logout: () => void;
};

// Prefer type over interface for simple objects
type AuthStore = AuthState & AuthAction;

// Use generics where appropriate
const useAuthStore = create<AuthStore>()(...);

// Avoid `any` - use `unknown` if type is truly unknown
```

**Allowed TS Pragmas** (eslint configured):

- `@ts-expect-error` - with description (min 3 chars)
- `@ts-ignore` - with description (use sparingly)

### 3. Naming Conventions

```typescript
// Components: PascalCase
export const LoginForm = () => { ... };
export default function NoteCard() { ... }

// Hooks: camelCase with 'use' prefix
export const useLogin = () => { ... };
export const useDebounce = () => { ... };

// API hooks: useXxxAction pattern
export const useCreateNote = () => useMutation({ ... });
export const useGetNotes = () => useQuery({ ... });

// Zustand stores: useXxxStore pattern
export const useAuthStore = create()(...);
export const useSettingsStore = create()(...);

// Files: Match export name
LoginForm.tsx → export const LoginForm
NoteCard.tsx → export default function NoteCard
useLogin.ts → export const useLogin
```

### 4. Component Structure

```typescript
// Client components (default for interactivity)
"use client";

import { useState } from "react";
import { Button } from "@/shared/components/ui/button";

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

export const LoginForm = ({ onSuccess, onSwitchToRegister }: LoginFormProps) => {
  // 1. Hooks
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLogin();

  // 2. Handlers
  const handleSubmit = async (data: FormData) => {
    await loginMutation.mutateAsync(data);
    onSuccess?.();
  };

  // 3. JSX
  return (
    <form onSubmit={handleSubmit}>
      {/* Component content */}
    </form>
  );
};
```

**Key Points**:

- Add `"use client"` directive for client-side components
- Use optional chaining for callbacks: `onSuccess?.()`
- Prefer named exports for reusable components
- Default export for page components or single-export files

### 5. API Layer (TanStack Query + Orval)

```typescript
// features/auth/api/useLogin.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login } from "@/shared/services/generated/api"; // Orval-generated
import { toast } from "sonner";

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      toast.success("Login successful");
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: (error) => {
      toast.error(error.message || "Login failed");
    },
  });
};
```

**Pattern**:

- All API functions generated via `npm run codegen` (Orval)
- Wrap generated functions in custom hooks with TanStack Query
- Use `toast` (sonner) for user feedback
- Invalidate queries on mutations to update cache

### 6. State Management (Zustand)

```typescript
// features/auth/store/authStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

type AuthStore = {
  isAuth: boolean;
  login: () => void;
  logout: () => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      isAuth: false,
      login: () => set({ isAuth: true }),
      logout: () => set({ isAuth: false }),
    }),
    { name: "auth-storage" }, // localStorage key
  ),
);
```

**When to use Zustand**:

- Client-side UI state (auth, settings, modals)
- Persistent local preferences

**When to use TanStack Query**:

- Server state (API data)
- Caching and background updates

### 7. Error Handling

```typescript
// Use try-catch for async operations
const handleAction = async () => {
  try {
    await someAsyncOperation();
    toast.success("Success message");
  } catch (error) {
    console.error("Error context:", error);
    toast.error(error.message || "Operation failed");
  }
};

// Let TanStack Query handle API errors via onError
const mutation = useMutation({
  mutationFn: apiCall,
  onError: (error) => {
    // Error handling here
  },
});
```

## Additional Guidelines

- **Forms**: Use `react-hook-form` + `zod` for validation
- **UI Components**: Use shadcn/ui components from `@/shared/components/ui`
- **Icons**: Use `lucide-react` icons
- **Animations**: Use `framer-motion` for complex animations
- **Styling**: Use Tailwind CSS utility classes (see `tailwind.config.ts` for custom theme)
- **Client/Server**: Add `"use client"` for components with hooks, events, or browser APIs

## Common Patterns

**Barrel Exports** (index.ts):

```typescript
// features/auth/index.ts
export { useLogin } from "./api/useLogin";
export { useAuthStore } from "./store/authStore";
```

**Conditional Rendering**:

```typescript
{isLoading && <Spinner />}
{data && <Content data={data} />}
{error && <ErrorMessage error={error} />}
```

## Notes for Agents

- Regenerate API client after backend changes: `npm run codegen`
- All API requests use `withCredentials: true` for HttpOnly cookies
- Middleware in `middleware.ts` handles auth redirects
- AutoLogin component in `features/auth/store/autoLogin.tsx` handles token refresh
- Do not commit `.env` files (use `.env.example` as template)
