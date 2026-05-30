# Refactor Backlog

The first architecture pass moved real code into modules, services, config, shared types, and feature folders while preserving runtime behavior.

Remaining high-risk backend work:

- Split `backend/src/modules/tasks/task.routes.js` into `task.controller.js`, `task.service.js`, and `task.repository.js`.
- Split `project.routes.js`, `user.routes.js`, `workspace.routes.js`, and `department.routes.js` into controllers/services.
- Add request validation schemas per module after route/controller boundaries are stable.
- Replace backend JavaScript mirrored constants with `@itpm/shared` after a safe TypeScript or build-step migration.

These files were intentionally kept functional rather than partially converted because they contain coupled authorization, notification, socket, activity log, and KPI workflows.
