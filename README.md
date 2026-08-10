# Flowboard

Flowboard is a collaborative-style task board with a Node.js backend and SQLite persistence.

## Run locally

Use Node.js 22.5 or later, then run:

```sh
npm start
```

Open `http://localhost:4173`. Workspace data is stored in `data/flowboard.db`; this directory is intentionally ignored by Git.

## API

- `GET /api/health` — service health check
- `GET /api/state` / `PUT /api/state` — complete persisted workspace
- `GET /api/boards` — board summaries
- `GET /api/boards/:id` — board, lists, and cards

For production, deploy the app to a Node-compatible service and mount persistent disk storage for the `data/` directory.
