# Mind Notion

Local development uses four services:

- Frontend: Next.js app at `http://localhost:3000`
- Backend: Go API at `http://localhost:8080/api/v1`
- Collab server: Yjs websocket server at `ws://localhost:1234`
- AI service: FastAPI service at `http://localhost:8090`

## Prerequisites

- Node.js 20+
- pnpm 9+
- Go 1.22+
- Docker and Docker Compose
- Python 3.11+
- `uv` for the AI service, or a Python virtualenv fallback

## First-time Setup

Install frontend/workspace dependencies:

```bash
pnpm install
```

Install the collab server dependencies separately. `collab-server` is not part of `pnpm-workspace.yaml`.

```bash
cd collab-server
npm install
cd ..
```

Prepare backend config for local ports:

```bash
cd backend
cp configs/config.local.yaml configs/config.yaml
cd ..
```

Prepare AI env if needed:

```bash
cd ai-services
cp .env.example .env
cd ..
```

At minimum, set `OPENAI_API_KEY` in `ai-services/.env` when using AI features.

Prepare collab env:

```bash
cat > collab-server/.env <<'EOF'
DATABASE_URL=postgres://postgres:password@localhost:5433/collaborative_editor?sslmode=disable
COLLAB_TOKEN_SECRET=dev-collab-token-secret
COLLAB_PORT=1234
EOF
```

`COLLAB_TOKEN_SECRET` must match `backend/configs/config.yaml` under `collab.token_secret`.

## Run Services Locally

Use separate terminals.

1. Start database and Redis:

```bash
cd backend
make db-up
```

This exposes:

- PostgreSQL: `localhost:5433`
- Redis: `localhost:6380`
- Adminer: `http://localhost:8081`

2. Start backend:

```bash
cd backend
go run ./cmd/app
```

3. Start AI service:

```bash
cd ai-services
make install
make dev
```

Fallback without `uv`:

```bash
cd ai-services
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
AI_SERVICE_RELOAD=true python -m ai_services.main
```

4. Start collab server:

```bash
cd collab-server
npm run dev
```

5. Start frontend:

```bash
pnpm --filter web dev
```

The frontend reads `apps/web/.env`. For local full stack it should include:

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_COLLAB_URL=ws://localhost:1234
```

## Docker Backend Stack

To run backend, PostgreSQL, Redis, Adminer, and AI service through Docker:

```bash
cd backend
make dev-up
```

Then run only the frontend separately:

```bash
pnpm --filter web dev
```

Stop the Docker stack:

```bash
cd backend
make dev-down
```

## Common Commands

```bash
pnpm --filter web dev       # frontend
pnpm --filter web lint      # frontend lint
pnpm --filter web build     # frontend build

cd backend && go run ./cmd/app
cd backend && make db-up
cd backend && make db-down

cd collab-server && npm run dev

cd ai-services && make dev
```

## Troubleshooting

If the frontend fails with:

```text
"./editor.css" is not exported under the condition "style" from package @mind-notion/editor
```

the app is importing `@mind-notion/editor/editor.css`, so `packages/editor/package.json` must export that CSS path, or the frontend import must be changed to an exported path.

If collab connects but rejects tokens, check that these values match:

- `backend/configs/config.yaml`: `collab.token_secret`
- `collab-server/.env`: `COLLAB_TOKEN_SECRET`

If backend cannot connect to PostgreSQL, make sure `make db-up` is running and backend config uses port `5433`, not container port `5432`.
