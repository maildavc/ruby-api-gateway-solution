#!/bin/bash

# Test Login Endpoint with Encrypted Payload
# This script tests the AES-128-CBC decryption with the provided credentials

set -e

echo "🧪 Testing Login Endpoint with Encrypted Payload"
echo "================================================"
echo ""

# Configuration
GATEWAY_URL=${GATEWAY_URL:-http://localhost:5000}
JWT_TOKEN=${JWT_TOKEN:-"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtb2JpbGUtYXBwLTAwMSIsImNsaWVudF9pZCI6Im1vYmlsZS1hcHAtMDAxIiwiYXVkIjoiZ2F0ZXdheS1hcGkiLCJleHAiOjk5OTk5OTk5OTl9.placeholder"}

echo "📋 Test Details:"
echo "   Gateway URL: $GATEWAY_URL"
echo "   Endpoint: /payhub/login"
echo "   Method: POST"
echo "   Client: mobile-app-001"
echo ""
echo "🔐 Encryption Details:"
echo "   Algorithm: AES-128-CBC"
echo "   Secret Key: zAL7X5AVRm8l4Ifs"
echo "   IV: BE/s3V0HtpPsE+1x"
echo "   Encoding: Base64"
echo ""
echo "📦 Original Payload (will be decrypted by gateway):"
cat <<'EOF'
{
    "username": "oladeji.olanipekun@sterling.ng",
    "password": "Password@123",
    "token": "jhfjfe"
}
EOF
echo ""
echo ""
echo "🔒 Encrypted Payload (sent to gateway):"
cat <<'EOF'
{
    "data": "I2nafHFXYj0PW/HYYgd4md23/tuPR8PZmvtuZGrJMI8RQC+o22SGWJh7bpkkj6WqdPDp+Y11EmQ5sGQtJWqHl3H/v8uTC09I5GFd8tDJqJ5JCFLSZwo3iz91u8EUjPgb"
}
EOF
echo ""
echo ""

# Test 1: Send encrypted payload to login endpoint
echo "🚀 Test 1: Sending encrypted login request..."
echo "-------------------------------------------"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$GATEWAY_URL/payhub/login" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "data": "I2nafHFXYj0PW/HYYgd4md23/tuPR8PZmvtuZGrJMI8RQC+o22SGWJh7bpkkj6WqdPDp+Y11EmQ5sGQtJWqHl3H/v8uTC09I5GFd8tDJqJ5JCFLSZwo3iz91u8EUjPgb"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo "HTTP Status Code: $HTTP_CODE"
echo "Response Body: $BODY"
echo ""

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
    echo "✅ Request successful!"
    echo "   Gateway decrypted the payload and forwarded to upstream"
elif [ "$HTTP_CODE" -eq 404 ]; then
    echo "⚠️  404 Not Found - Make sure to:"
    echo "   1. Apply migration: ./scripts/apply-login-migration.sh"
    echo "   2. Restart the gateway"
    echo "   3. Trigger policy refresh: curl -X POST $GATEWAY_URL/admin/refresh-policies -H \"Authorization: Bearer $JWT_TOKEN\""
elif [ "$HTTP_CODE" -eq 401 ]; then
    echo "❌ 401 Unauthorized - JWT token is invalid or missing"
    echo "   Please set a valid JWT_TOKEN environment variable"
elif [ "$HTTP_CODE" -eq 403 ]; then
    echo "❌ 403 Forbidden - Client not authorized for this endpoint"
    echo "   Check client_permissions table"
elif [ "$HTTP_CODE" -eq 400 ]; then
    echo "⚠️  400 Bad Request - Possible decryption error"
    echo "   $BODY"
else
    echo "❌ Unexpected response: $HTTP_CODE"
    echo "   $BODY"
fi

echo ""
echo "================================================"
echo ""

# Test 2: Verify endpoint is registered
echo "🔍 Test 2: Checking if endpoint is registered..."
echo "-------------------------------------------"

if command -v psql &> /dev/null; then
    echo "Checking database for login endpoint..."
    PGPASSWORD=gateway123 psql -h localhost -U gateway -d gateway -c \
        "SELECT endpoint_name, http_method, payload_expectation, crypto_algorithm FROM endpoints WHERE endpoint_name = 'login';" \
        2>/dev/null || echo "⚠️  Could not connect to database"
else
    echo "⚠️  psql not found, skipping database check"
fi

echo ""
echo "================================================"
echo ""

# Instructions
echo "📝 Next Steps:"
echo ""
echo "If you got a 404 error, run:"
echo "  1. Apply the migration:"
echo "     docker exec -i gateway-postgres psql -U gateway -d gateway < database/migrations/003_add_login_endpoint.sql"
echo ""
echo "  2. Restart the gateway or trigger policy refresh:"
echo "     curl -X POST $GATEWAY_URL/admin/refresh-policies -H \"Authorization: Bearer $JWT_TOKEN\""
echo ""
echo "If you need to generate a valid JWT token:"
echo "  Visit https://jwt.io and use:"
echo "  Payload: {\"sub\": \"mobile-app-001\", \"client_id\": \"mobile-app-001\", \"aud\": \"gateway-api\", \"exp\": 9999999999}"
echo "  Algorithm: HS256"
echo "  Secret: your-256-bit-secret"
echo ""
echo "To check gateway logs:"
echo "  Check the console output of 'dotnet run' in src/Gateway.Api"
echo ""
