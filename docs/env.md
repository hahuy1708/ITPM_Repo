# Environment

Copy `.env.example` into the appropriate local environment files.

Backend variables:

- `NODE_ENV`
- `PORT`
- `MONGO_URI` or legacy `MONGODB_URI`
- `CLIENT_URL` or legacy `FRONTEND_URL`
- `CORS_ORIGIN`
- `JWT_ACCESS_SECRET` or legacy `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `STORAGE_DRIVER`
- `FILE_STORAGE_PATH`
- `FILE_PUBLIC_BASE_URL`
- `MAX_FILE_SIZE_MB`

Frontend variables:

- `VITE_API_BASE_URL`
- `VITE_APP_NAME`

Legacy `VITE_API_URL` is still accepted during migration.
