# Architecture

ITPM Repo is kept as an npm monorepo with `frontend`, `backend`, and `packages/shared`.

The current refactor intentionally keeps the existing `frontend` and `backend` top-level folders to avoid a high-risk path migration while the app is already functional.

## Backend

Backend uses Express and Mongoose. The target structure is module-based:

- `src/config`: environment, database, CORS, mail, and storage configuration.
- `src/constants`: roles, permissions, status values, and notification types.
- `src/modules`: feature modules for auth, users, departments, projects, tasks, comments, notifications, invitations, workspaces, analytics, audit logs, uploads, and conversations.
- `src/middlewares`: Express middleware.
- `src/services`: cross-module services such as mail, notifications, sockets, file storage, deadline scanning, and KPI calculation.
- `src/utils`: framework-agnostic helpers such as response formatting, async handling, object id validation, and pagination.

Request flow:

```txt
request -> route -> middleware -> controller -> service -> repository/model -> response/error middleware
```

## Frontend

Frontend uses React, TypeScript, Vite, Tailwind CSS, and TanStack Query. The target structure is feature-based:

- `src/app`: app shell, providers, routes, and layouts.
- `src/features`: pages, feature components, API clients, hooks, schemas, and local utilities.
- `src/components`: shared UI/layout/common/feedback components.
- `src/lib`: HTTP client, query client, storage, and generic helpers.
- `src/types`: compatibility exports and app-specific UI types.

## Shared Package

`packages/shared` contains TypeScript constants and types shared by the frontend. Backend remains JavaScript for now, so backend constants are mirrored with TODO notes until a safe TypeScript migration is done.
