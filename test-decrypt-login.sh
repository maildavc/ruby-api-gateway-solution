#!/bin/bash

echo "======================================"
echo "Testing Gateway Decryption & Forwarding"
echo "======================================"
echo ""

# Get JWT token for mobile-app-001
echo "Step 1: Getting JWT token for mobile-app-001..."
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:5000/gateway/payhub-admin/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "mobile-app-001",
    "client_secret": "mobile-secret-123"
  }')

echo "Token response: $TOKEN_RESPONSE"
echo ""

# Extract token
TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
  echo "ERROR: Failed to get token"
  exit 1
fi

echo "Token obtained: ${TOKEN:0:50}..."
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

RESPONSE=$(curl -v -X POST http://localhost:5000/gateway/payhub-admin/login \
  -H "Authorization: Bearer $TOKEN" \
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

echo "Check the gateway logs above to see the decryption process!"
