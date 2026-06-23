#!/bin/bash

echo "========================================="
echo "API GATEWAY LOGIN TEST"
echo "========================================="
echo ""

# Test data
ENCRYPTED_PAYLOAD='{"data": "I2nafHFXYj0PW/HYYgd4mQqjN8FbFlxgpXCTaNY/ZI9SBG7rNfqBwulzFN6amZCGrRh6m4Kaac+7dd3KTviucqk2PeiQjlhgS0c5mVnzKcw="}'

# Generate a test JWT token (for local testing - no signature validation)
# Header: {"alg":"HS256","typ":"JWT"}
# Payload: {"sub":"mobile-app-001","client_id":"mobile-app-001","aud":"gateway-api","exp":9999999999}
# This is a test token - in production, use proper signed tokens
JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtb2JpbGUtYXBwLTAwMSIsImNsaWVudF9pZCI6Im1vYmlsZS1hcHAtMDAxIiwiYXVkIjoiZ2F0ZXdheS1hcGkiLCJleHAiOjk5OTk5OTk5OTl9.HWiNrLpQbGNmjBGgF5I7JqZ3uB_Qy4xR5oC6sK8tY2M"

echo "1. ENCRYPTED PAYLOAD (Input)"
echo "----------------------------"
echo "$ENCRYPTED_PAYLOAD" | jq '.'
echo ""

echo "2. SENDING TO GATEWAY"
echo "----------------------------"
echo "URL: http://localhost:5100/payhub/login"
echo "Method: POST"
echo "Headers:"
echo "  - Content-Type: application/json"
echo "  - Authorization: Bearer $JWT_TOKEN"
echo ""

echo "3. GATEWAY RESPONSE"
echo "----------------------------"

# Make the request and capture response
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST http://localhost:5100/payhub/login \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d "$ENCRYPTED_PAYLOAD")

# Extract HTTP status
HTTP_STATUS=$(echo "$RESPONSE" | grep HTTP_STATUS | cut -d: -f2)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

echo "Status Code: $HTTP_STATUS"
echo "Response Body:"
if [ -n "$RESPONSE_BODY" ]; then
    echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
else
    echo "(empty)"
fi

echo ""
echo "========================================="
echo "Expected Behavior:"
echo "  1. Gateway receives encrypted payload"
echo "  2. Gateway decrypts using AES-128-CBC"
echo "  3. Gateway forwards plaintext to upstream"
echo "  4. Gateway encrypts response"
echo "  5. Client receives encrypted response"
echo "========================================="
