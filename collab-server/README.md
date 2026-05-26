# Collaboration Server (y-websocket)

This service hosts the Yjs websocket provider with snapshot persistence.

## Setup

- `COLLAB_TOKEN_SECRET` should match backend `collab.token_secret`.
- `COLLAB_PORT` defaults to `1234`.
- `DATABASE_URL`.

Local `.env` example:

```bash
DATABASE_URL=postgres://postgres:password@localhost:5433/collaborative_editor?sslmode=disable
COLLAB_TOKEN_SECRET=dev-collab-token-secret
COLLAB_PORT=1234
```

The default backend local config uses `dev-collab-token-secret`, so use the same value here.

## Run

```bash
npm install
npm run dev
```

## WebSocket URL

Clients connect using:

```
ws://<host>:<port>/<noteId>?token=<jwt>
```
