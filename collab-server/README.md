# Collaboration Server (y-websocket)

This service hosts the Yjs websocket provider with snapshot persistence.

## Setup

- `COLLAB_TOKEN_SECRET` should match backend `collab.token_secret`.
- `COLLAB_PORT` defaults to `1234`.
- `DATABASE_URL`.

## Run

```bash
npm install
npm run start
```

## WebSocket URL

Clients connect using:

```
ws://<host>:<port>/<noteId>?token=<jwt>
```
