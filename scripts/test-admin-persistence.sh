#!/usr/bin/env bash
set -euo pipefail

log_file="/tmp/gateway-middleware.log"
suffix=$(date +%s)
product_name="Portal Test Product ${suffix}"
service_name="Portal Test Service ${suffix}"
client_id_value="portal_test_client_${suffix}"
client_name="Portal Test Client ${suffix}"
user_id_value="portal_test_client_${suffix}"

dotnet run --project "/Users/olawoleomotosho/Gapeiro/GapeiroTechnologies/Projects /ruby-api-gateway-solution/src/Gateway.Middleware.Api/Gateway.Middleware.Api.csproj" >"$log_file" 2>&1 &
server_pid=$!

cleanup() {
  kill "$server_pid" 2>/dev/null || true
  wait "$server_pid" 2>/dev/null || true
}
trap cleanup EXIT

for _ in {1..20}; do
  if curl -s "http://localhost:5173/admin/management/products" >/dev/null; then
    break
  fi
  sleep 1
  if ! kill -0 "$server_pid" 2>/dev/null; then
    echo "Server failed to start."
    tail -n 50 "$log_file"
    exit 1
  fi
done

product_id=$(curl -s -X POST "http://localhost:5173/admin/management/products" -H "Content-Type: application/json" -d "{\"name\":\"$product_name\",\"description\":\"Created via admin portal test\",\"ownerTeam\":\"Platform\",\"isEnabled\":true}" | python -c 'import json,sys; print(json.load(sys.stdin)["id"])')
service_id=$(curl -s -X POST "http://localhost:5173/admin/management/services" -H "Content-Type: application/json" -d "{\"productId\":\"$product_id\",\"serviceName\":\"$service_name\",\"basePath\":\"/portal-test\",\"version\":\"v1\",\"description\":\"Service created via API\",\"ownerTeam\":\"Platform\",\"clusterId\":\"primary\",\"destinations\":[\"https://example.internal\"]}" | python -c 'import json,sys; print(json.load(sys.stdin)["id"])')
endpoint_id=$(curl -s -X POST "http://localhost:5173/admin/management/endpoints" -H "Content-Type: application/json" -d "{\"serviceId\":\"$service_id\",\"endpointName\":\"Portal Test Endpoint\",\"httpMethod\":\"POST\",\"relativePath\":\"/test\"}" | python -c 'import json,sys; print(json.load(sys.stdin)["id"])')

curl -s -X POST "http://localhost:5173/admin/management/service-destinations" -H "Content-Type: application/json" -d "{\"serviceId\":\"$service_id\",\"destinationName\":\"primary\",\"address\":\"https://example.internal\",\"weight\":1,\"priority\":0,\"isEnabled\":true}" >/dev/null

client_id=$(curl -s -X POST "http://localhost:5173/admin/management/clients" -H "Content-Type: application/json" -d "{\"clientId\":\"$client_id_value\",\"clientName\":\"$client_name\",\"clientSecret\":\"secret\",\"isEnabled\":true}" | python -c 'import json,sys; print(json.load(sys.stdin)["id"])')

curl -s -X POST "http://localhost:5173/admin/management/client-permissions" -H "Content-Type: application/json" -d "{\"clientId\":\"$client_id\",\"endpointId\":\"$endpoint_id\",\"isEnabled\":true}" >/dev/null

curl -s -X POST "http://localhost:5173/admin/management/user-profiles" -H "Content-Type: application/json" -d "{\"userId\":\"$user_id_value\",\"serviceId\":\"$service_id\",\"encryptionKey\":\"c29tZS1rZXk=\",\"encryptionIv\":\"c29tZS1pdg==\",\"isEnabled\":true}" >/dev/null

echo "Product ID: $product_id"
echo "Service ID: $service_id"
echo "Endpoint ID: $endpoint_id"
echo "Client ID: $client_id"
echo "User ID: $user_id_value"
