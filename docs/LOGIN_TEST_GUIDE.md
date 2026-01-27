# Testing Login Endpoint with Encrypted Payload

## ✅ Test Results Summary

The decryption tests have passed successfully! Your payload can be decrypted correctly using:
- **Key**: `zAL7X5AVRm8l4Ifs`
- **IV**: `BE/s3V0HtpPsE+1x`
- **Algorithm**: AES-128-CBC

## 🚀 Complete Setup and Testing Guide

### Step 1: Start Infrastructure

```bash
cd "/Users/olawoleomotosho/Gapeiro/GapeiroTechnologies/Projects /ruby-api-gateway-solution"

# Start all services
docker-compose up -d

# Wait for services to be ready (about 30 seconds)
docker-compose ps
```

### Step 2: Initialize Database

```bash
# Run the initial schema and seed data
chmod +x scripts/setup-db.sh
./scripts/setup-db.sh

# Add the login endpoint
chmod +x scripts/apply-login-migration.sh
./scripts/apply-login-migration.sh
```

### Step 3: Start the Gateway

```bash
cd src/Gateway.Api
dotnet run
```

The gateway will start on:
- HTTP: http://localhost:5000
- HTTPS: https://localhost:5001

### Step 4: Generate JWT Token

For testing, go to [https://jwt.io](https://jwt.io) and create a token with:

**Header:**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload:**
```json
{
  "sub": "mobile-app-001",
  "client_id": "mobile-app-001",
  "aud": "gateway-api",
  "exp": 9999999999
}
```

**Secret:** `your-256-bit-secret`

Copy the generated JWT token.

### Step 5: Test the Login Endpoint

#### Option A: Using the Test Script

```bash
chmod +x scripts/test-login.sh

# Set your JWT token
export JWT_TOKEN="your-jwt-token-here"

# Run the test
./scripts/test-login.sh
```

#### Option B: Using curl directly

```bash
curl -X POST http://localhost:5000/payhub/login \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "I2nafHFXYj0PW/HYYgd4md23/tuPR8PZmvtuZGrJMI8RQC+o22SGWJh7bpkkj6WqdPDp+Y11EmQ5sGQtJWqHl3H/v8uTC09I5GFd8tDJqJ5JCFLSZwo3iz91u8EUjPgb"
  }'
```

## 📋 What Happens

1. **Client sends** encrypted payload:
   ```json
   {
     "data": "I2nafHFXYj0PW/HYYgd4md23/tuPR8PZmvtuZGrJMI8RQC+o22SGWJh7bpkkj6WqdPDp+Y11EmQ5sGQtJWqHl3H/v8uTC09I5GFd8tDJqJ5JCFLSZwo3iz91u8EUjPgb"
   }
   ```

2. **Gateway decrypts** using AES-128-CBC with your keys

3. **Decrypted payload** (what upstream receives):
   ```json
   {
     "username": "oladeji.olanipekun@sterling.ng",
     "password": "Password@123",
     "token": "jhfjfe"
   }
   ```

4. **Gateway forwards** decrypted JSON to upstream service

## 🔍 Debugging

### Check Gateway Logs
Watch the console output where you ran `dotnet run`. Look for:
- JWT authentication success/failure
- Policy resolution
- Decryption success/failure
- Upstream proxy status

### Check Database Configuration
```bash
docker exec -it gateway-postgres psql -U gateway -d gateway -c "
SELECT 
    e.endpoint_name,
    e.payload_expectation,
    e.crypto_algorithm,
    u.user_id,
    u.encryption_key,
    u.encryption_iv
FROM endpoints e
JOIN services s ON s.id = e.service_id
JOIN user_profiles u ON u.service_id = s.id
WHERE e.endpoint_name = 'login'
AND u.user_id = 'mobile-app-001';
"
```

Expected output:
```
 endpoint_name | payload_expectation | crypto_algorithm |    user_id        |   encryption_key      |   encryption_iv
---------------+---------------------+------------------+-------------------+-----------------------+----------------------
 login         | Decrypted           | AES_128_CBC      | mobile-app-001    | ekFMN1g1QVZSbThsNElmcw== | QkUvczNWMEh0cFBzRSsxeA==
```

### Check Redis Cache
```bash
# Check if policies are cached
docker exec -it gateway-valkey valkey-cli KEYS "policy:*"

# View a specific policy
docker exec -it gateway-valkey valkey-cli GET "policy:POST:/payhub/login"
```

### Trigger Manual Policy Refresh
```bash
curl -X POST http://localhost:5000/admin/refresh-policies \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## ❌ Common Issues

### Issue: 404 Not Found
**Solution:** 
1. Make sure you ran the migration: `./scripts/apply-login-migration.sh`
2. Restart the gateway or refresh policies
3. Check if endpoint exists in database

### Issue: 401 Unauthorized
**Solution:**
1. Generate a valid JWT token at jwt.io
2. Ensure token includes `sub` or `client_id` claim with value `mobile-app-001`
3. Set correct audience: `gateway-api`

### Issue: 403 Forbidden
**Solution:**
1. Check client_permissions table
2. Ensure mobile-app-001 has permission to access login endpoint

### Issue: 400 Bad Request (Decryption Failed)
**Solution:**
1. Verify keys in database match your encryption keys
2. Check algorithm is set to AES_128_CBC
3. Ensure payload is Base64 encoded

## 📊 Expected Results

### Success Response (200 OK)
```json
{
  "message": "Login successful",
  "userId": "some-user-id"
}
```
*(This depends on your upstream service implementation)*

### Gateway Logs (Success)
```
[INFO] Request completed
- CorrelationId: abc123
- ClientId: mobile-app-001
- Path: /payhub/login
- StatusCode: 200
- ElapsedMs: 12
```

### Kafka Event (if events enabled)
```json
{
  "correlationId": "abc123",
  "productName": "SeaBaaS",
  "serviceName": "PayHub",
  "endpointName": "login",
  "clientId": "mobile-app-001",
  "method": "POST",
  "path": "/payhub/login",
  "upstreamStatusCode": 200,
  "latencyMs": 12,
  "timestamp": "2026-01-27T10:00:00Z"
}
```

## 🔐 Security Notes

- The gateway stores encryption keys in the database (Base64 encoded)
- Decrypted payloads are never logged
- All operations are traced with correlation IDs
- JWT tokens must be valid and not expired
- Client must have explicit permission to access the endpoint

## 📈 Monitoring

- **Metrics**: http://localhost:5000/metrics
- **Health**: http://localhost:5000/health
- **Kafka UI**: http://localhost:8080 (if you want to see events)

## ✅ Verification Checklist

- [ ] Docker containers running (postgres, valkey, kafka)
- [ ] Database initialized with schema
- [ ] Login endpoint migration applied
- [ ] Gateway running without errors
- [ ] JWT token generated and valid
- [ ] Test curl command returns 200 OK
- [ ] Upstream service receives decrypted payload

---

**Your test payload is ready to use!** The gateway will automatically decrypt it using AES-128-CBC before forwarding to your upstream login service.
