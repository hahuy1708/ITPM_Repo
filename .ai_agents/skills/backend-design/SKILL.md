---
name: backend-design
description: Create distinctive, production-grade backend systems with exceptional architectural quality. Use this skill when the user asks to build APIs, servers, database schemas, microservices, backend logic, data pipelines, or full backend applications (examples include REST/GraphQL APIs, WebSocket servers, workers, authentication systems, or when optimizing/refactoring any backend code). Generates creative, secure, scalable, and maintainable code and architecture that avoids generic boilerplate and "copy-paste" solutions.
---

This skill guides creation of distinctive, production-grade backend architectures that avoid generic, insecure, or unoptimized patterns. Implement real working code with exceptional attention to security, performance, scalability, maintainability, and developer experience.

The user provides backend requirements: an API endpoint set, full service, database design, worker system, or complete backend. They may include context about purpose, expected scale, tech stack preference, compliance needs, or constraints.

## Design Thinking

Before coding, understand the context and commit to a BOLD architectural direction:
- **Purpose**: What core problem does this backend solve? What are the critical data flows, user journeys, and non-functional requirements (latency, throughput, reliability)?
- **Tone**: Pick an extreme: minimalist monolithic elegance, event-driven microservices chaos, serverless maximalism, domain-driven design purity, functional/reactive paradise, CQRS + Event Sourcing mastery, real-time WebSocket-first, batch-processing pipeline beast, or hexagonal clean-architecture heaven.
- **Constraints**: Language/runtime (Node.js, Python, Go, Rust, Java, Elixir, etc.), deployment target (Kubernetes, serverless, bare metal), compliance (GDPR, SOC2, PCI), team size, and timeline.
- **Differentiation**: What makes this backend UNFORGETTABLE and superior? Sub-millisecond latency, bulletproof security by design, effortless horizontal scaling, zero-downtime deployments, or developer joy that makes the team fall in love with the codebase?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Over-engineering for future scale and ruthless simplicity both work — the key is intentional trade-offs and rock-solid reasoning.

Then implement working code (Express/Fastify, FastAPI, Gin, Axum, Spring Boot, Phoenix, etc.) that is:
- Production-grade and fully functional out of the box
- Secure, observable, and testable by default
- Cohesive with a clear architectural point-of-view
- Meticulously refined in every detail (validation, error handling, logging, documentation, CI/CD readiness)

## Backend Architecture Guidelines

Focus on:
- **Architecture & Organization**: Clean/Hexagonal/Vertical Slice/DDD structure. Feature-based or domain-driven folders that scale beautifully. Never god classes or flat folders.
- **Data Layer**: Thoughtful persistence choice (PostgreSQL + Prisma, Mongo + Mongoose, Redis + Dragonfly, etc.), proper indexing, migrations, connection pooling, and query optimization. Include schema diagrams (Mermaid) when helpful.
- **API & Communication**: Elegant REST, GraphQL, tRPC, or gRPC with perfect versioning, pagination, filtering, rate limiting, and OpenAPI/Swagger. WebSocket or SSE when real-time is needed.
- **Security First**: Auth (JWT + refresh, OAuth2, Passkeys, session), input validation/sanitization (Zod, Pydantic, etc.), secrets management (Doppler/Vault), OWASP Top 10 compliance, rate limiting, CORS, helmet-style protections. Never ship without it.
- **Performance & Scalability**: Async everywhere possible, caching strategy (Redis + cache-aside or write-through), background jobs (BullMQ, Celery, Sidekiq), connection pooling, graceful shutdown, and horizontal scaling patterns.
- **Observability**: Structured logging (Pino, Loguru), metrics (Prometheus), distributed tracing (OpenTelemetry), health checks, and error tracking (Sentry). Include ready-to-use dashboards.
- **Testing & Reliability**: Unit + integration + contract + load tests (Vitest, pytest, k6). Always include meaningful tests and example .env + docker-compose.
- **Developer Experience**: Excellent README with architecture decision records (ADR), Postman/Insomnia collection, hot-reload setup, and clear contribution guidelines.

NEVER use generic backend patterns like:
- Unvalidated endpoints
- Hardcoded secrets or API keys
- Missing error boundaries and proper HTTP status codes
- No tests or only trivial tests
- Single-file "app.js" monsters without justification
- Ignoring security, logging, or observability

Interpret creatively and make unexpected, context-perfect choices (e.g., Rust for a performance-critical path, Elixir for real-time chat, Go for massive throughput, TypeScript end-to-end for full-stack harmony). No two backends should feel the same. Vary languages, patterns, and depth of sophistication.

**IMPORTANT**: Match implementation complexity to the architectural vision. Complex systems deserve thoughtful abstractions, clear diagrams, and future-proofing. Simple systems deserve ruthless elegance and minimal cognitive load.

Remember: You are capable of extraordinary creative work. Don't hold back — show what can truly be created when thinking outside the box and committing fully to a distinctive, battle-tested, production-ready vision.