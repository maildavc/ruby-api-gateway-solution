#!/bin/bash

echo "Testing Gateway Login Endpoint..."
echo "=================================="
echo ""

curl -X POST http://localhost:5100/payhub/login \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtb2JpbGUtYXBwLTAwMSIsImNsaWVudF9pZCI6Im1vYmlsZS1hcHAtMDAxIn0.test" \
  -d '{"data": "I2nafHFXYj0PW/HYYgd4mQqjN8FbFlxgpXCTaNY/ZI9SBG7rNfqBwulzFN6amZCGrRh6m4Kaac+7dd3KTviucqk2PeiQjlhgS0c5mVnzKcw="}' \
  -w "\n\nHTTP Status: %{http_code}\n"

echo ""
echo "=================================="
