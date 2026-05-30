# Backend TypeScript Migration Plan

Backend remains JavaScript during this refactor to avoid breaking a working API while architecture is being normalized.

Recommended migration steps:

1. Add TypeScript build tooling (`typescript`, `tsx`, and `@types/*`) after module boundaries are stable.
2. Convert config, constants, and utils first.
3. Convert models with typed schemas.
4. Convert services and repositories.
5. Convert controllers and routes last.
6. Replace backend mirrored constants with imports from `@itpm/shared` once runtime build supports it.

Avoid converting only part of a route stack if it forces mixed module systems or fragile runtime transpilation.
