# API

Base URL is configured by environment:

- Frontend: `VITE_API_BASE_URL`
- Backend: `/api`

Standard response:

```json
{
  "success": true,
  "message": "OK",
  "data": {}
}
```

Standard error response:

```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {}
  }
}
```

Main API groups:

- `/api/auth`
- `/api/workspace`
- `/api/users`
- `/api/departments`
- `/api/projects`
- `/api/tasks`
- `/api/upload`
- `/api/analytics`
- `/api/notifications`
- `/api/audit-logs`
