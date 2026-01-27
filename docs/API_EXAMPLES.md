# Sample curl commands for testing the API Gateway

# ==========================
# Prerequisites
# ==========================
# 1. Start infrastructure: docker-compose up -d
# 2. Initialize database: ./scripts/setup-db.sh
# 3. Run gateway: cd src/Gateway.Api && dotnet run

# ==========================
# Generate Test JWT (for development)
# ==========================
# Use https://jwt.io with this payload:
# {
#   "sub": "mobile-app-001",
#   "client_id": "mobile-app-001",
#   "aud": "gateway-api",
#   "exp": 9999999999
# }
# Secret: your-256-bit-secret (for HS256)

JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtb2JpbGUtYXBwLTAwMSIsImNsaWVudF9pZCI6Im1vYmlsZS1hcHAtMDAxIiwiYXVkIjoiZ2F0ZXdheS1hcGkiLCJleHAiOjk5OTk5OTk5OTl9.SIGNATURE"

# ==========================
# Health Check
# ==========================
curl -i http://localhost:5000/health

# ==========================
# 1. Name Enquiry (Encrypted - Pass Through)
# ==========================
# This endpoint expects encrypted payload and forwards it as-is
curl -i -X POST http://localhost:5000/payhub/name-enquiry \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
  }'

# Expected: 200 OK (if upstream is configured)
# Gateway will NOT decrypt, just forward

# ==========================
# 2. Transfer (Decrypted)
# ==========================
# This endpoint expects encrypted payload, gateway decrypts before forwarding
# Note: You need to encrypt actual data with the client's key

# Example with AES-256-CBC-HMAC encrypted data
curl -i -X POST http://localhost:5000/payhub/transfer \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "base64-encoded-encrypted-transfer-payload"
  }'

# Expected: Gateway decrypts and forwards plaintext to upstream

# ==========================
# 3. Balance Enquiry (Decrypted)
# ==========================
curl -i -X POST http://localhost:5000/payhub/balance-enquiry \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "base64-encoded-encrypted-balance-request"
  }'

# ==========================
# 4. Test Authorization Failure
# ==========================
# Web portal should NOT have access to transfer endpoint
WEB_PORTAL_JWT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ3ZWItcG9ydGFsLTAwMSIsImNsaWVudF9pZCI6IndlYi1wb3J0YWwtMDAxIiwiYXVkIjoiZ2F0ZXdheS1hcGkiLCJleHAiOjk5OTk5OTk5OTl9.SIGNATURE"

curl -i -X POST http://localhost:5000/payhub/transfer \
  -H "Authorization: Bearer $WEB_PORTAL_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "test"
  }'

# Expected: 403 Forbidden

# ==========================
# 5. Admin: Refresh Policies
# ==========================
curl -i -X POST http://localhost:5000/admin/refresh-policies \
  -H "Authorization: Bearer $JWT_TOKEN"

# Expected: 200 OK with refresh confirmation

# ==========================
# 6. Test Unauthorized Access (No JWT)
# ==========================
curl -i -X POST http://localhost:5000/payhub/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "data": "test"
  }'

# Expected: 401 Unauthorized

# ==========================
# 7. Prometheus Metrics
# ==========================
curl http://localhost:5000/metrics

# ==========================
# 8. Check Correlation ID
# ==========================
curl -i http://localhost:5000/health | grep X-Correlation-Id

# ==========================
# Kafka Events Monitoring
# ==========================
# View events in Kafka UI: http://localhost:8080
# Or use kafka-console-consumer:
docker exec -it gateway-kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic gateway.payhub.events \
  --from-beginning \
  --property print.headers=true

# ==========================
# Database Queries
# ==========================
# Check loaded data
docker exec -it gateway-postgres psql -U gateway -d gateway -c "SELECT * FROM products;"
docker exec -it gateway-postgres psql -U gateway -d gateway -c "SELECT * FROM services;"
docker exec -it gateway-postgres psql -U gateway -d gateway -c "SELECT * FROM endpoints;"
docker exec -it gateway-postgres psql -U gateway -d gateway -c "SELECT * FROM clients;"
docker exec -it gateway-postgres psql -U gateway -d gateway -c "SELECT * FROM client_permissions;"

# ==========================
# Redis Cache Inspection
# ==========================
# Check cached policies
docker exec -it gateway-valkey valkey-cli KEYS "policy:*"
docker exec -it gateway-valkey valkey-cli GET "policy:POST:/payhub/transfer"

# Check cached permissions
docker exec -it gateway-valkey valkey-cli KEYS "perm:*"
