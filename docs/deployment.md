# Deployment

Docker Compose provides three services:

- `mongo`
- `backend`
- `frontend`

Production deployments should provide secrets through environment variables or a secret manager. Do not hard-code production credentials in `docker-compose.yml`.

Uploads should be mounted as a volume and only `.gitkeep` should be tracked in source control.
