#!/bin/bash

echo "======================================"
echo "Testing Gateway Decryption & Forwarding"
echo "======================================"
echo ""

# JWT token with mobile-app-001 as subject
# Payload: {"sub":"mobile-app-001","client_id":"mobile-app-001","aud":"gateway-api","exp":9999999999}
JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtb2JpbGUtYXBwLTAwMSIsImNsaWVudF9pZCI6Im1vYmlsZS1hcHAtMDAxIiwiYXVkIjoiZ2F0ZXdheS1hcGkiLCJleHAiOjk5OTk5OTk5OTl9.HWiNrLpQbGNmjBGgF5I7JqZ3uB_Qy4xR5oC6sK8tY2M"

echo "Step 1: JWT Token (client: mobile-app-001)"
echo "Token: ${JWT_TOKEN:0:50}..."
echo ""

# Post encrypted login data
echo "======================================"
echo "Step 2: Posting encrypted login data to gateway..."
echo "======================================"
echo "Endpoint: http://localhost:5000/gateway/payhub-admin/login"
echo "Encrypted Data: I2nafHFXYj0PW/HYYgd4mQqjN8FbFlxgpXCTaNY/ZI9SBG7rNfqBwulzFN6amZCGrRh6m4Kaac+7dd3KTviucqk2PeiQjlhgS0c5mVnzKcw="
echo ""
echo "Expected decryption keys:"
echo "  Key: zAL7X5AVRm8l4Ifs"
echo "  IV:  BE/s3V0HtpPsE+1x"
echo ""
echo "Expected forwarding to: https://test-gateway.sterling.ng/gateway/payhub-admin-middleware-dev/api/auth/login"
echo ""

RESPONSE=$(curl -v -X POST http://localhost:5000/gateway/payhub-admin/login \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "I2nafHFXYj0PW/HYYgd4mQqjN8FbFlxgpXCTaNY/ZI9SBG7rNfqBwulzFN6amZCGrRh6m4Kaac+7dd3KTviucqk2PeiQjlhgS0c5mVnzKcw="
  }' 2>&1)

echo ""
echo "======================================"
echo "Response:"
echo "======================================"
echo "$RESPONSE"
echo ""

echo "======================================"
echo "Check the gateway logs for decryption process details!"
echo "Run: tail -f /tmp/gateway-log.txt"
echo "======================================"
