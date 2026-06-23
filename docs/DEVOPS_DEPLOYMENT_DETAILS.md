# DevOps Deployment Details

This document captures the current container deployment details for the two images already built and pushed to ACR.

## Registry Images

ACR login server:

`devengracr.azurecr.io`

Images:

- Gateway API: `devengracr.azurecr.io/seabaasapigateway-core-api:latest`
- Developer Portal: `devengracr.azurecr.io/seabaasapigateway-dev-portal:latest`

Both images were built for `linux/amd64`.

## Runtime Ports

### Gateway API

- Container port: `8080`
- Source: [src/Gateway.Api/Dockerfile](../src/Gateway.Api/Dockerfile)
- Docker runtime setting: `ASPNETCORE_URLS=http://+:8080`
- Exposed port: `8080`

Important note:

- Local development config in [src/Gateway.Api/appsettings.Development.json](../src/Gateway.Api/appsettings.Development.json) sets Kestrel to `http://localhost:5001`
- Container deployments should use `8080`, not `5001`

### Developer Portal

- Container port: `3000`
- Source: [src/gateway-portal-developer/Dockerfile](../src/gateway-portal-developer/Dockerfile)
- Exposed port: `3000`
- Startup command: `npm run start`

Important note:

- Local dev mode normally uses `3000`
- On one local run it shifted to `3001` only because `3000` was already occupied
- Container deployments should use `3000`

## Health and Probes

### Gateway API

- Health endpoint: `GET /health`
- Source: [src/Gateway.Api/Health/HealthCheckExtensions.cs](../src/Gateway.Api/Health/HealthCheckExtensions.cs)
- Suggested Kubernetes probes:
  - Liveness: `http://<pod-ip>:8080/health`
  - Readiness: `http://<pod-ip>:8080/health`

### Developer Portal

- No dedicated health endpoint was found in the current app
- Suggested temporary readiness check: `GET /login` on port `3000`
- Suggested temporary liveness check: `GET /` or `GET /login` on port `3000`

## Required Environment Configuration

### Gateway API

The API throws on startup if these values are missing:

- `ConnectionStrings__PostgreSQL`
- `ConnectionStrings__Redis`
- `Kafka__BootstrapServers`

Recommended explicit production settings:

- `ConnectionStrings__PostgreSQL=<postgres connection string>`
- `ConnectionStrings__Redis=<redis connection string>`
- `Kafka__BootstrapServers=<host:port[,host:port]>`
- `Jwt__SecretKey=<32+ char secret>`
- `Jwt__Authority=<issuer url if used>`
- `Jwt__Audience=SeaBaasAPIGateway`
- `Jwt__RequireHttpsMetadata=true`
- `Jwt__ValidateIssuer=true`
- `Jwt__ValidateAudience=true`
- `OpenTelemetry__ServiceName=SeaBaasAPIGateway`
- `OpenTelemetry__ServiceVersion=1.0.0`
- `ASPNETCORE_URLS=http://+:8080`

Operational note:

- [src/Gateway.Api/appsettings.json](../src/Gateway.Api/appsettings.json) still defaults `Jwt:Audience` to `gateway-api`
- [src/Gateway.Api/appsettings.Development.json](../src/Gateway.Api/appsettings.Development.json) uses `SeaBaasAPIGateway`
- DevOps should set `Jwt__Audience` explicitly in the deployment to avoid ambiguity

Database note:

- The code defaults PostgreSQL search path to `"SeaBaasAPIGateway-Core"` when the connection string omits `Search Path`
- Source: [src/Gateway.Api/Configuration/ConfigurationExtensions.cs](../src/Gateway.Api/Configuration/ConfigurationExtensions.cs)

## Database Scripts

This section lists all database SQL migrations and database-related helper scripts currently present in the repository.

### All Migration SQL Files

Location: [database/migrations](../database/migrations)

- [database/migrations/000_create_schema.sql](../database/migrations/000_create_schema.sql)
- [database/migrations/001_initial_schema.sql](../database/migrations/001_initial_schema.sql)
- [database/migrations/002_seed_data.sql](../database/migrations/002_seed_data.sql)
- [database/migrations/003_add_login_endpoint.sql](../database/migrations/003_add_login_endpoint.sql)
- [database/migrations/004_load_balancing.sql](../database/migrations/004_load_balancing.sql)
- [database/migrations/005_convert_ids_to_uuid.sql](../database/migrations/005_convert_ids_to_uuid.sql)
- [database/migrations/006_enterprise_identity.sql](../database/migrations/006_enterprise_identity.sql)
- [database/migrations/007_org_access_management.sql](../database/migrations/007_org_access_management.sql)
- [database/migrations/008_import_seabaas_smartadapter.sql](../database/migrations/008_import_seabaas_smartadapter.sql)
- [database/migrations/009_dev_destinations.sql](../database/migrations/009_dev_destinations.sql)

Recommended full execution order for a fresh environment:

1. 000_create_schema.sql
2. 001_initial_schema.sql
3. 002_seed_data.sql
4. 003_add_login_endpoint.sql
5. 004_load_balancing.sql
6. 005_convert_ids_to_uuid.sql
7. 006_enterprise_identity.sql
8. 007_org_access_management.sql
9. 008_import_seabaas_smartadapter.sql
10. 009_dev_destinations.sql

### All Database-Related Scripts

Location: [scripts](../scripts)

- [scripts/setup-db.sh](../scripts/setup-db.sh)
  Purpose: initializes database and applies early schema and seed scripts (001 and 002).
- [scripts/migrate-db.sh](../scripts/migrate-db.sh)
  Purpose: applies the scripted migration sequence from 001 through 007.
- [scripts/apply-login-migration.sh](../scripts/apply-login-migration.sh)
  Purpose: applies only 003_add_login_endpoint.sql.
- [scripts/import_swagger_seed.py](../scripts/import_swagger_seed.py)
  Purpose: imports swagger-driven seed data.
- [scripts/test-login.sh](../scripts/test-login.sh)
  Purpose: validates login behavior after migration.
- [scripts/test-admin-persistence.sh](../scripts/test-admin-persistence.sh)
  Purpose: validates admin persistence behavior.
- [scripts/test_e2e.py](../scripts/test_e2e.py)
  Purpose: end-to-end verification.
- [scripts/latency_test.py](../scripts/latency_test.py)
  Purpose: latency/performance verification support.

### Deployment Notes for DevOps

- [scripts/migrate-db.sh](../scripts/migrate-db.sh) does not currently include 000, 008, or 009.
- For complete deployment parity, apply 000 first and then apply 008 and 009 after running migrate-db.sh.
- Ensure DB connection environment variables are set before execution:
  - DB_HOST
  - DB_PORT
  - DB_NAME
  - DB_USER
  - DB_PASSWORD

### Developer Portal

Public runtime environment variables:

- `NEXT_PUBLIC_GATEWAY_BASE_URL`
- `NEXT_PUBLIC_PORTAL_NAME`
- `NEXT_PUBLIC_SUPPORT_EMAIL`

Current defaults from [src/gateway-portal-developer/lib/config/env.ts](../src/gateway-portal-developer/lib/config/env.ts):

- `NEXT_PUBLIC_GATEWAY_BASE_URL=` empty by default
- `NEXT_PUBLIC_PORTAL_NAME=SeaBaas Developer Portal`
- `NEXT_PUBLIC_SUPPORT_EMAIL=support@gapeiro.dev`

Recommended deployment values:

- `NEXT_PUBLIC_GATEWAY_BASE_URL=https://<gateway-public-base-url>`
- `NEXT_PUBLIC_PORTAL_NAME=SeaBaas Developer Portal`
- `NEXT_PUBLIC_SUPPORT_EMAIL=support@gapeiro.dev`
- `PORT=3000`

OAuth provider variables are optional and only needed if social login is enabled:

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `AZURE_AD_CLIENT_ID`
- `AZURE_AD_CLIENT_SECRET`
- `AZURE_AD_TENANT_ID`
- `APPLE_CLIENT_ID`
- `APPLE_CLIENT_SECRET`

Auth note:

- If OAuth env vars are missing, the NextAuth route returns `500` for OAuth sign-in attempts
- The mocked email/password login route under [src/gateway-portal-developer/app/api/auth/login/route.ts](../src/gateway-portal-developer/app/api/auth/login/route.ts) still returns a successful mock session

## Example Container Settings

### Gateway API

- Image: `devengracr.azurecr.io/seabaasapigateway-core-api:latest`
- Container port: `8080`
- Probe path: `/health`

### Developer Portal

- Image: `devengracr.azurecr.io/seabaasapigateway-dev-portal:latest`
- Container port: `3000`
- Probe path: `/login` until a dedicated health endpoint is added

## Summary For DevOps

- Gateway API image: `devengracr.azurecr.io/seabaasapigateway-core-api:latest`
- Gateway API port: `8080`
- Gateway API health check: `/health`
- Developer Portal image: `devengracr.azurecr.io/seabaasapigateway-dev-portal:latest`
- Developer Portal port: `3000`
- Developer Portal temporary health check: `/login`