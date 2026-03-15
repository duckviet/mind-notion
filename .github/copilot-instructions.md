# Copilot Instructions for `gin-collaborative-editor`

This repository is a multi-service monorepo. Keep changes minimal, scoped, and consistent with existing patterns.

## Repository Layout

- `backend/`: Go + Gin API (Clean Architecture, OpenAPI-driven)
- `frontend/`: Next.js + TypeScript app (Feature-Sliced Design)
- `collab-server/`: Node.js WebSocket collaboration service
- `extension/`: Browser extension code
- `ai-services/`: Python AI services (`agent` + `rag`)

## Global Rules

- Prefer surgical edits over broad refactors.
- Do not change unrelated files.
- Follow naming/style conventions already used in each package.
- Keep public APIs and contracts backward-compatible unless asked otherwise.
- If touching generated artifacts, update their source and regenerate instead of manual edits.

## Folder-Specific Guidance

### `backend/`

- Follow layered architecture: repository → service → handler.
- Keep `context.Context` as the first argument in repository/service methods.
- For API shape changes, update OpenAPI specs under `backend/openapi/` and regenerate code.
- Use existing Make targets for generation and local workflows.

### `frontend/`

- Respect Feature-Sliced Design import boundaries (`features`/`entities`/`shared`).
- Prefer `@/*` absolute imports for cross-layer imports.
- Use strict TypeScript types; avoid `any`.
- Keep UI consistent with existing component and Tailwind conventions.

### `collab-server/`, `extension/`, `ai-services/`

- Match local style and dependency patterns in each service.
- Avoid introducing new frameworks unless required.

## Validation Before Finishing

- Run the smallest relevant checks for changed areas only.
- Backend: `go test ./...` (or narrower package tests first).
- Frontend: `npm run lint` (and relevant build/type checks when needed).
- If commands are too heavy, run targeted checks and state what was validated.

## Non-Goals

- Do not add new architecture layers, design systems, or sweeping formatting changes.
- Do not rewrite generated files by hand when regeneration is available.
- Do not commit secrets or environment-specific credentials.
