# ITPM Repo

Internal project/task management system for workspaces, departments, projects, tasks, comments, notifications, invitations, uploads, analytics, and KPI tracking.

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: Node.js, Express, MongoDB, Mongoose
- Realtime: Socket.IO
- Monorepo: npm workspaces

## Structure

```txt
ITPM_Repo/
├── frontend/
├── backend/
├── packages/
│   └── shared/
├── docs/
├── scripts/
├── .ai_agents/
├── .env.example
├── docker-compose.yml
├── package.json
└── README.md
```

The repo currently keeps `frontend` and `backend` at the root to avoid a risky path migration. Internal code is being normalized toward feature/module boundaries.

## Setup

```bash
npm install
```

Create environment files from examples:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.development
```

## Development

```bash
npm run dev
npm run dev:web
npm run dev:api
```

## Build

```bash
npm run build
```

## Docker

```bash
docker compose up --build
```

## Docs

- [Architecture](docs/architecture.md)
- [API](docs/api.md)
- [Environment](docs/env.md)
- [Database Schema](docs/database-schema.md)
- [Deployment](docs/deployment.md)
- [Refactor Backlog](docs/refactor-backlog.md)
- [Testing](docs/testing.md)
- [Backend Setup](docs/backend-setup.md)
- [Frontend Setup](docs/frontend-setup.md)
- [Communication System](docs/communication-system.md)
- [Backend Communication System](docs/backend-communication-system.md)
- [Frontend Communication System](docs/frontend-communication-system.md)
- [Implementation Summary](docs/implementation-summary.md)
