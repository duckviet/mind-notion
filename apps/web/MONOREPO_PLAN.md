# Plan hoàn chỉnh: Refactor `mind-notion` sang Monorepo

## 📋 Tổng quan mục tiêu

Chuyển từ cấu trúc hiện tại sang pnpm workspace monorepo để:
- Tái sử dụng Tiptap extensions giữa **web app** và **Chrome extension**
- Giữ nguyên kiến trúc **FSD** bên trong `apps/web`
- Deploy Vercel không bị gián đoạn
- Backend/services không bị ảnh hưởng

---

## 🎯 Cấu trúc mục tiêu

```
mind-notion/
├── apps/
│   ├── web/                    ← từ frontend/ (giữ nguyên FSD)
│   │   ├── app/ page/ widgets/ features/ entities/ shared/
│   │   ├── next.config.ts
│   │   └── package.json
│   │
│   └── extension/              ← từ extension/ (Vite + React + TS)
│       ├── src/{popup,content,background}/
│       ├── vite.config.ts
│       └── package.json
│
├── packages/
│   ├── editor/                 ← Tiptap shared (extract từ web)
│   │   ├── src/{extensions,components,hooks,types}/
│   │   ├── src/index.ts
│   │   └── package.json
│   │
│   └── tsconfig/               ← Shared TS configs
│       ├── base.json
│       ├── nextjs.json
│       └── package.json
│
├── backend/                    ← giữ nguyên
├── ai-services/                ← giữ nguyên
├── collab-server/              ← giữ nguyên
├── Dockerfile, heroku.yml, Procfile, go.mod  ← giữ nguyên
│
├── package.json                ← workspace root (mới)
├── pnpm-workspace.yaml         ← (mới)
└── .gitignore                  ← cập nhật
```

---

## 🗓️ Roadmap 4 phases

### **Phase 0 — Chuẩn bị (30 phút)**

```bash
# 1. Đảm bảo working tree sạch
cd ~/mind-notion
git status
git add . && git commit -m "chore: snapshot before monorepo migration"

# 2. Tạo branch mới
git checkout -b feat/monorepo-migration

# 3. Backup .env files (Vercel env không bị ảnh hưởng nhưng local thì có)
cp frontend/.env.local frontend/.env.local.bak 2>/dev/null || true
cp extension/.env extension/.env.bak 2>/dev/null || true

# 4. Verify pnpm version
pnpm -v   # cần >= 9
```

**Checklist:**
- [ ] Đã commit tất cả thay đổi pending
- [ ] Đã backup `.env*` files
- [ ] Đã ghi nhớ Vercel env vars (chụp màn hình Settings → Environment Variables)
- [ ] Có pnpm >= 9

---

### **Phase 1 — Setup workspace + di chuyển web (1 ngày)**

#### 1.1. Tạo workspace root

```bash
cd ~/mind-notion
```

`pnpm-workspace.yaml`:
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

`package.json` (root):
```json
{
  "name": "mind-notion",
  "private": true,
  "engines": { "node": ">=20", "pnpm": ">=9" },
  "scripts": {
    "dev": "pnpm --filter web dev",
    "dev:ext": "pnpm --filter extension dev",
    "build": "pnpm --filter web build",
    "build:ext": "pnpm --filter extension build",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck",
    "clean": "pnpm -r exec rm -rf node_modules .next dist .turbo"
  },
  "packageManager": "pnpm@9.0.0"
}
```

Cập nhật `.gitignore` (root):
```
node_modules
.next
dist
.turbo
*.log
.env*.local
```

#### 1.2. Di chuyển `frontend/` → `apps/web/`

```bash
mkdir -p apps
mv frontend apps/web

# Xóa node_modules + lock cũ để pnpm tạo lại từ workspace root
rm -rf apps/web/node_modules apps/web/package-lock.json
```

Sửa `apps/web/package.json`:
```json
{
  "name": "web",        // đổi từ "frontend" → "web"
  "version": "0.1.0",
  "private": true,
  ...
}
```

#### 1.3. Tạo `packages/tsconfig`

```bash
mkdir -p packages/tsconfig
```

`packages/tsconfig/package.json`:
```json
{
  "name": "@mind-notion/tsconfig",
  "version": "0.0.1",
  "private": true,
  "files": ["base.json", "nextjs.json"]
}
```

`packages/tsconfig/base.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleResolution": "bundler",
    "jsx": "react-jsx"
  }
}
```

`packages/tsconfig/nextjs.json`:
```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "module": "esnext",
    "noEmit": true,
    "incremental": true,
    "plugins": [{ "name": "next" }]
  }
}
```

#### 1.4. Install + verify web vẫn chạy

```bash
cd ~/mind-notion
pnpm install
pnpm --filter web dev
# → mở http://localhost:3000, verify OK
pnpm --filter web build
# → build pass mới đi tiếp
```

**Checkpoint commit:**
```bash
git add .
git commit -m "feat(monorepo): setup pnpm workspace, move frontend to apps/web"
```

---

### **Phase 2 — Extract `packages/editor` (2 ngày)**

#### 2.1. Tạo skeleton

```bash
mkdir -p packages/editor/src/{extensions,components,hooks,types,styles}
```

`packages/editor/package.json`:
```json
{
  "name": "@mind-notion/editor",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./styles": "./src/styles/index.css"
  },
  "peerDependencies": {
    "react": ">=19",
    "react-dom": ">=19",
    "@tiptap/react": ">=3",
    "@tiptap/core": ">=3",
    "@tiptap/pm": ">=3"
  },
  "devDependencies": {
    "@mind-notion/tsconfig": "workspace:*",
    "typescript": "^5"
  }
}
```

`packages/editor/tsconfig.json`:
```json
{
  "extends": "@mind-notion/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

> **Lý do dùng `main: ./src/index.ts` thay vì build dist:** Next.js (qua `transpilePackages`) và Vite đều xử lý TS source trực tiếp được. Không cần build step → DX nhanh hơn, hot reload tức thì.

#### 2.2. Xác định những file cần di chuyển

Từ `apps/web/features/note-editing/` và liên quan:

| Từ `apps/web/`                                    | Đến `packages/editor/src/`     |
|---------------------------------------------------|--------------------------------|
| `features/note-editing/ui/Tiptap.tsx`             | `components/Tiptap.tsx`        |
| `features/note-editing/ui/Extensions/*`           | `extensions/*`                 |
| `features/note-editing/ui/Toolbar/*`              | `components/Toolbar/*`         |
| `features/note-editing/ui/hooks/*`                | `hooks/*`                      |
| `features/note-editing/ui/useTiptapEditor.ts`     | `hooks/useTiptapEditor.ts`     |
| `features/note-editing/ui/TableOfContents.tsx`    | `components/TableOfContents.tsx` |
| `features/collaborative-editor/*` (phần Tiptap)   | `extensions/collaboration/`    |

**⚠️ Quy tắc move:**
- Chỉ move thứ **không phụ thuộc vào `@/` paths** của web (ví dụ: `@/shared`, `@/entities`)
- Nếu có dependency ngược → refactor để nhận props/config thay vì import trực tiếp
- Logic gọi API (Orval) **KHÔNG** move vào editor — giữ ở web, truyền vào qua callback

#### 2.3. Quy trình move từng file (an toàn)

Cho mỗi file/folder:

```bash
# 1. Move file vật lý
git mv apps/web/features/note-editing/ui/Extensions packages/editor/src/extensions

# 2. Trong file mới: fix imports
#    - @/shared/utils/foo  →  refactor: nhận qua props/config
#    - relative imports     →  giữ nguyên (đã move cùng folder)
#    - @tiptap/*           →  giữ nguyên (peer dep)

# 3. Trong apps/web: re-export từ package
# apps/web/features/note-editing/ui/index.ts
export { ExtCustomCodeBlock, useTiptapEditor, ... } from "@mind-notion/editor";

# 4. Test build
pnpm --filter web build
```

#### 2.4. Public API — `packages/editor/src/index.ts`

```typescript
// Extensions (named exports cho tree-shaking)
export { default as ExtCustomCodeBlock } from "./extensions/ExtCodeBlock";
export { default as ExtImage } from "./extensions/ExtImage";
export { default as ExtImageUpload } from "./extensions/ExtImageUpload";
export { default as ExtTaskListKit } from "./extensions/ExtTaskList";
export { default as ExtTableOfContents } from "./extensions/ExtTableOfContents";
export { default as ExtAI } from "./extensions/ExtAI";
// ... rest

// Components
export { default as Tiptap } from "./components/Tiptap";
export { Toolbar } from "./components/Toolbar";
export { TableOfContents } from "./components/TableOfContents";

// Hooks
export { useTiptapEditor } from "./hooks/useTiptapEditor";

// Types
export type {
  UseTiptapEditorProps,
  CollaborationConfig,
  AISelectionContext,
} from "./types";
```

#### 2.5. Cập nhật `apps/web`

`apps/web/package.json` — thêm:
```json
{
  "dependencies": {
    "@mind-notion/editor": "workspace:*"
  },
  "devDependencies": {
    "@mind-notion/tsconfig": "workspace:*"
  }
}
```

`apps/web/next.config.ts`:
```typescript
const nextConfig: NextConfig = {
  transpilePackages: ["@mind-notion/editor"],
  // ... existing config
};
```

`apps/web/tsconfig.json`:
```json
{
  "extends": "@mind-notion/tsconfig/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

```bash
pnpm install
pnpm --filter web dev   # smoke test
pnpm --filter web build
```

**Checkpoint commit:**
```bash
git commit -m "feat(monorepo): extract Tiptap into @mind-notion/editor package"
```

---

### **Phase 3 — Setup `apps/extension` (2-3 ngày)**

#### 3.1. Di chuyển + chuyển sang Vite + React

```bash
mv extension apps/extension
cd apps/extension
rm -rf node_modules dist
```

`apps/extension/package.json`:
```json
{
  "name": "extension",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "vite build --watch",
    "build": "vite build",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@mind-notion/editor": "workspace:*",
    "react": "^19",
    "react-dom": "^19",
    "@tiptap/core": "^3",
    "@tiptap/react": "^3",
    "@tiptap/pm": "^3"
  },
  "devDependencies": {
    "@crxjs/vite-plugin": "^2.0.0-beta",
    "@mind-notion/tsconfig": "workspace:*",
    "@types/chrome": "^0.0.270",
    "vite": "^5",
    "typescript": "^5"
  }
}
```

`apps/extension/vite.config.ts`:
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  resolve: {
    dedupe: [
      "react",
      "react-dom",
      "@tiptap/core",
      "@tiptap/react",
      "@tiptap/pm",
    ],
  },
  build: {
    rollupOptions: {
      input: {
        popup: "src/popup/index.html",
        // content + background được crxjs tự xử lý qua manifest
      },
    },
  },
});
```

#### 3.2. Cấu trúc source

```
apps/extension/
├── manifest.json
├── src/
│   ├── popup/
│   │   ├── index.html
│   │   ├── main.tsx           ← React entry, import editor
│   │   └── PopupApp.tsx
│   ├── content/
│   │   └── content.ts         ← Vanilla TS, KHÔNG import editor
│   └── background/
│       └── background.ts
└── public/icons/
```

#### 3.3. Sử dụng editor trong popup

```typescript
// apps/extension/src/popup/PopupApp.tsx
import { useTiptapEditor, ExtTaskListKit } from "@mind-notion/editor";
import "@mind-notion/editor/styles";
import { EditorContent } from "@tiptap/react";

export function PopupApp() {
  const { editor } = useTiptapEditor({
    content: "",
    extensions: [ExtTaskListKit],
  });
  return <EditorContent editor={editor} />;
}
```

#### 3.4. Test build extension

```bash
pnpm --filter extension build
ls apps/extension/dist/
# → load unpacked vào chrome://extensions để test
```

**Checkpoint commit:**
```bash
git commit -m "feat(monorepo): refactor extension to Vite + React, use shared editor"
```

---

### **Phase 4 — Vercel deployment (30 phút)**

#### 4.1. Tạo `apps/web/vercel.json`

```json
{
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "buildCommand": "cd ../.. && pnpm --filter web build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

#### 4.2. Update Vercel Dashboard

**Project → Settings → General:**
- **Root Directory:** `frontend` → `apps/web`
- **Build & Development Settings:** để Vercel detect tự động (vercel.json sẽ override)
- **Node.js Version:** đảm bảo ≥ 20

**Settings → Environment Variables:** không cần đổi (key-value, không phụ thuộc path)

#### 4.3. Deploy preview trước khi merge

```bash
git push origin feat/monorepo-migration
```

Vercel tự deploy preview → kiểm tra:
- [ ] Build log: install pnpm OK, resolve workspace OK
- [ ] Preview URL chạy đúng
- [ ] Tất cả routes hoạt động
- [ ] Tiptap editor render OK
- [ ] API calls đến backend OK

#### 4.4. Merge

```bash
git checkout main
git merge feat/monorepo-migration
git push origin main
```

---

## ⚠️ Pitfalls thường gặp

| Vấn đề | Triệu chứng | Cách fix |
|---|---|---|
| **Duplicate React** | "Invalid hook call" trong extension | Thêm `dedupe: ["react", "react-dom"]` vào Vite |
| **Duplicate Tiptap** | Extensions không hoạt động, lỗi schema | Dedupe `@tiptap/core`, `@tiptap/pm`, `@tiptap/react` |
| **Next không transpile package** | `Unexpected token` khi build | Thêm `transpilePackages: ["@mind-notion/editor"]` |
| **Vercel không tìm thấy lockfile** | Install fail | `vercel.json` chạy `cd ../.. && pnpm install` |
| **CSS không apply trong extension** | Editor không có style | Import `@mind-notion/editor/styles`, dùng Shadow DOM nếu inject content script |
| **Path alias `@/` trong package** | Cannot resolve | Tuyệt đối không dùng `@/` trong `packages/editor`, chỉ relative |
| **Backend Docker build fail** | `Dockerfile` không tìm `frontend/` | Update `Dockerfile`, `heroku.yml` nếu có ref tới `frontend/` |

### Kiểm tra Dockerfile + heroku.yml

```bash
grep -r "frontend" Dockerfile heroku.yml Procfile build.sh 2>/dev/null
# Nếu có → đổi thành "apps/web"
```

---

## 📊 Timeline tổng kết

| Phase | Thời gian | Risk | Có thể rollback? |
|---|---|---|---|
| Phase 0: Chuẩn bị | 30 min | None | N/A |
| Phase 1: Workspace + move web | 1 ngày | Low | ✅ git revert |
| Phase 2: Extract editor package | 2 ngày | Medium | ✅ git revert |
| Phase 3: Extension refactor | 2-3 ngày | Medium | ✅ độc lập với web |
| Phase 4: Vercel deploy | 30 min | Low | ✅ revert Root Directory |
| **Tổng** | **~1 tuần** | | |

---

## ✅ Final checklist trước khi đóng task

- [ ] `pnpm install` từ root chạy clean
- [ ] `pnpm --filter web build` pass
- [ ] `pnpm --filter web dev` chạy đầy đủ tính năng
- [ ] `pnpm --filter extension build` pass, load vào Chrome OK
- [ ] Editor trong web và extension đều hoạt động
- [ ] Vercel preview deploy thành công
- [ ] Backend services không bị ảnh hưởng
- [ ] Đã update `Dockerfile`/`heroku.yml` nếu có ref tới `frontend/`
- [ ] README.md cập nhật hướng dẫn dev mới (`pnpm dev` thay vì `cd frontend && pnpm dev`)
- [ ] Team được thông báo về cấu trúc mới

---

## 🚀 Optional — Bước tiếp theo (sau migration)

1. **Turborepo** — cache build, parallel tasks, đặc biệt hữu ích khi có > 2 packages
2. **`@mind-notion/api-types`** — extract Orval-generated types nếu extension cũng gọi API
3. **`@mind-notion/ui`** — extract shadcn components nếu extension cần UI consistency
4. **Changesets** — versioning cho packages nếu publish ra ngoài

Bạn muốn mình đi sâu vào phase nào trước? Hay cần script tự động hóa một số bước?