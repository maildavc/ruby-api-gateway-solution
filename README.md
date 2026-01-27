# API Gateway - Production-Grade Low-Latency Solution

A high-performance API Gateway built with .NET 8, YARP, PostgreSQL, ValKey (Redis), and Kafka for ultra-low latency request routing with encryption/decryption, authorization, and observability.

## Features

- **Dynamic Routing**: YARP-based reverse proxy with database-driven route configuration
- **Encryption/Decryption**: Configurable per-endpoint AES-256-GCM and AES-256-CBC-HMAC support
- **Authorization**: JWT-based authentication with granular endpoint permissions
- **High Performance**: 
  - Two-tier caching (in-memory + ValKey/Redis)
  - Dapper for minimal DB overhead
  - Pooled buffers for crypto operations
  - Immutable policy snapshots for lock-free reads
- **Observability**: OpenTelemetry tracing, Prometheus metrics, structured logging with Serilog
- **Event Streaming**: Kafka integration for audit/telemetry events
- **Health Checks**: Built-in health monitoring and liveness probes

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ JWT + Encrypted Payload
       ↓
┌──────────────────────────────────────────────┐
│           API Gateway                         │
│  ┌────────────────────────────────────────┐  │
│  │  1. JWT Authentication                  │  │
│  │  2. Authorization (Client Permissions)  │  │
│  │  3. Policy Resolution (Cached)          │  │
│  │  4. Decrypt Transform (if needed)       │  │
│  │  5. YARP Proxy to Upstream              │  │
│  │  6. Emit Kafka Event (async)            │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
       │
       ├─→ PostgreSQL (Registry, Policies, Permissions)
       ├─→ ValKey/Redis (L2 Cache)
       ├─→ Kafka (Events)
       └─→ Upstream Services
```

## Project Structure

```
ruby-api-gateway-solution/
├── src/
│   ├── Gateway.Api/              # Main web application
│   ├── Gateway.Core/             # Domain models and enums
│   ├── Gateway.Data/             # Dapper repositories
│   └── Gateway.Infrastructure/   # Services, caching, crypto, YARP
├── database/
│   └── migrations/               # SQL schema and seed data
├── tests/
│   └── Gateway.Tests/            # Unit and integration tests
├── docker-compose.yml            # Infrastructure services
└── README.md
```

## Prerequisites

- .NET 8 SDK
- Docker and Docker Compose
- PostgreSQL 15+ (via Docker)
- ValKey or Redis (via Docker)
- Apache Kafka (via Docker)

## Quick Start

### 1. Start Infrastructure Services

```bash
# Start PostgreSQL, ValKey, Kafka, and Zookeeper
docker-compose up -d

# Wait for services to be healthy
docker-compose ps
```

### 2. Initialize Database

```bash
# Apply schema and seed data
docker exec -i gateway-postgres psql -U gateway -d gateway < database/migrations/001_initial_schema.sql
docker exec -i gateway-postgres psql -U gateway -d gateway < database/migrations/002_seed_data.sql
```

### 3. Run the Gateway

```bash
cd src/Gateway.Api
dotnet restore
dotnet run
```

The gateway will start on `https://localhost:5001` (HTTPS) and `http://localhost:5000` (HTTP).

### 4. Verify Health

```bash
curl http://localhost:5000/health
```

## Configuration

Edit `src/Gateway.Api/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "PostgreSQL": "Host=localhost;Port=5432;Database=gateway;Username=gateway;Password=gateway123",
    "Redis": "localhost:6379"
  },
  "Kafka": {
    "BootstrapServers": "localhost:9092"
  },
  "Jwt": {
    "Authority": "https://your-auth-server.com",
    "Audience": "gateway-api"
  }
}
```

## Sample Data

The seed script creates a **SeaBaaS** product with **PayHub** service containing three endpoints:

### Endpoints

| Endpoint          | HTTP Method | Path                   | Payload Expectation | Crypto Algorithm     |
|-------------------|-------------|------------------------|---------------------|----------------------|
| name-enquiry      | POST        | /payhub/name-enquiry   | Encrypted (pass-through) | AES-256-GCM (default) |
| transfer          | POST        | /payhub/transfer       | Decrypted            | AES-256-CBC-HMAC (override) |
| balance-enquiry   | POST, GET   | /payhub/balance-enquiry| Decrypted            | AES-256-GCM (default) |

### Clients

- **mobile-app-001**: Access to all PayHub endpoints
- **web-portal-001**: Access to name-enquiry and balance-enquiry only

## API Usage Examples

### 1. Get JWT Token

(Use your auth server to obtain a JWT token with claims: `sub` or `client_id`)

For testing, you can generate a JWT at https://jwt.io with:
```json
{
  "sub": "mobile-app-001",
  "aud": "gateway-api",
  "exp": 9999999999
}
```

### 2. Call Encrypted Endpoint (Pass-Through)

```bash
curl -X POST https://localhost:5001/payhub/name-enquiry \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
  }'
```

The gateway will NOT decrypt this payload and will forward it as-is to the upstream service.

### 3. Call Decrypted Endpoint

```bash
curl -X POST https://localhost:5001/payhub/transfer \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "<base64-encoded-encrypted-payload>"
  }'
```

The gateway will:
1. Extract encrypted data from the `data` field
2. Look up crypto keys for `mobile-app-001` and PayHub service
3. Decrypt using AES-256-CBC-HMAC
4. Forward the plaintext JSON to upstream

### 4. Manually Refresh Policies

```bash
curl -X POST https://localhost:5001/admin/refresh-policies \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Performance Considerations

### Caching Strategy

1. **L1 Cache (In-Memory)**: 5-minute TTL, 1000 item limit
2. **L2 Cache (ValKey/Redis)**: 10-30 minute TTL
3. **Background Refresh**: Every 30 seconds

### Hot Path Optimizations

- No DB calls during request handling (cache-only)
- Immutable policy snapshots (no locks)
- Pooled buffers for crypto operations
- Dapper with 5-second command timeout
- Fire-and-forget Kafka publishing
- Minimal LINQ in hot path

### Expected Latency

- Cache hit: < 5ms (p50), < 20ms (p99)
- Cache miss: < 50ms (p50), < 100ms (p99)
- Includes crypto decrypt: +2-10ms

## Observability

### Metrics (Prometheus)

```bash
curl http://localhost:5000/metrics
```

### Logs

Structured JSON logs with correlation IDs:
```json
{
  "timestamp": "2026-01-27T10:00:00Z",
  "level": "Information",
  "message": "Request completed",
  "properties": {
    "CorrelationId": "abc123",
    "ClientId": "mobile-app-001",
    "Path": "/payhub/transfer",
    "StatusCode": 200,
    "ElapsedMs": 12
  }
}
```

### Kafka Events

Events are published to `{topic_prefix}.events` with schema:
```json
{
  "correlationId": "abc123",
  "productName": "SeaBaaS",
  "serviceName": "PayHub",
  "endpointName": "transfer",
  "clientId": "mobile-app-001",
  "method": "POST",
  "path": "/payhub/transfer",
  "upstreamStatusCode": 200,
  "latencyMs": 12,
  "timestamp": "2026-01-27T10:00:00Z"
}
```

View events in Kafka UI: http://localhost:8080

## Database Schema

See [database/migrations/001_initial_schema.sql](database/migrations/001_initial_schema.sql) for the complete schema.

Key tables:
- `products`: Top-level product grouping
- `services`: Service registry with upstream config and policies
- `endpoints`: Individual API endpoints with crypto overrides
- `clients`: API clients
- `client_permissions`: Granular endpoint permissions
- `user_profiles`: Client-specific encryption keys/IVs

## Security

### Encryption

- **AES-256-GCM**: Authenticated encryption with 96-bit nonce
- **AES-256-CBC-HMAC**: Encrypt-then-MAC with separate keys
- Keys stored Base64-encoded in PostgreSQL
- Per-client, per-service key isolation

### Authentication & Authorization

- JWT bearer tokens (RS256 or HS256)
- Client permissions checked on every request
- Scopes/claims validation
- IP allowlisting (optional)

### PII Protection

- Decrypted payloads never logged
- Crypto keys redacted from logs
- Correlation IDs for tracing

## Development

### Build

```bash
dotnet build ApiGateway.sln
```

### Test

```bash
dotnet test
```

### Hot Reload

The gateway supports hot reload of policies via the background refresh service or manual trigger.

## Production Deployment

1. **Database**: Use managed PostgreSQL (AWS RDS, Azure Database, etc.)
2. **Cache**: Use managed Redis (AWS ElastiCache, Azure Cache, etc.) or ValKey cluster
3. **Kafka**: Use managed Kafka (Confluent Cloud, AWS MSK, etc.)
4. **Secrets**: Use environment variables or secret managers (AWS Secrets Manager, Azure Key Vault)
5. **Scaling**: Run multiple gateway instances behind a load balancer
6. **Monitoring**: Export OpenTelemetry to Jaeger/Zipkin, Prometheus/Grafana

### Environment Variables

```bash
ConnectionStrings__PostgreSQL="Host=prod-db;Port=5432;..."
ConnectionStrings__Redis="prod-redis:6379"
Kafka__BootstrapServers="prod-kafka:9092"
Jwt__Authority="https://prod-auth.example.com"
```

## Troubleshooting

### Gateway returns 404

- Check if endpoint is registered in database
- Verify service and endpoint are enabled (`is_enabled = true`)
- Trigger policy refresh: `POST /admin/refresh-policies`

### Gateway returns 403

- Verify JWT token contains correct `sub` or `client_id`
- Check `client_permissions` table for client/endpoint mapping
- Ensure client is enabled in `clients` table

### Decryption fails

- Verify user has crypto profile in `user_profiles` for the service
- Check key/IV encoding matches endpoint policy (Base64/Hex)
- Ensure algorithm matches (AES-256-GCM vs CBC-HMAC)

### Cache not working

- Check ValKey/Redis is running: `docker-compose ps valkey`
- Verify connection string in `appsettings.json`
- Check logs for cache warnings

## License

MIT License - see LICENSE file for details.

## Contributors

Built by the Gapeiro Platform Team.

For questions or issues, please open a GitHub issue.
