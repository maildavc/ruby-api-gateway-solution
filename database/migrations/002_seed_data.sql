-- Seed data for API Gateway
-- UUID-based seed data for products, services, endpoints, clients, permissions, and user profiles

SET search_path TO "SeaBaasAPIGateway-Core";

-- Ensure UUID support
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert Product + Service
WITH product AS (
    INSERT INTO products (id, name, description, owner_team, is_enabled)
    VALUES (gen_random_uuid(), 'SeaBaaS', 'Sea Banking as a Service Platform', 'Platform Team', true)
    RETURNING id
),
service AS (
    INSERT INTO services (
        id, product_id, service_name, base_path, version, description, owner_team,
        is_enabled, environment, cluster_id, destinations, load_balancing_policy,
        health_check_enabled, health_check_path, health_check_interval_seconds,
        enable_tracing, enable_metrics, log_sampling,
        requires_jwt, required_scopes,
        cache_enabled, cache_ttl_seconds,
        emit_events, topic_prefix, event_schema_version,
        default_crypto_algorithm, default_key_source, default_iv_source,
        default_encoding, default_require_iv
    )
    SELECT
        gen_random_uuid(),
        product.id,
        'PayHub', '/payhub', 'v1', 'Payment Hub Service', 'Payments Team',
        true, 'dev', 'payhub-cluster',
        '["http://payhub-service-1:8080", "http://payhub-service-2:8080"]'::jsonb,
        'RoundRobin',
        true, '/health', 30,
        true, true, 1.0,
        true, '["payhub:read", "payhub:write"]'::jsonb,
        true, 300,
        true, 'gateway.payhub', 'v1',
        'AES_256_GCM', 'UserProfileKey', 'UserProfileIv',
        'Base64', true
    FROM product
    RETURNING id
)
-- 1. name-enquiry (expects encrypted payload)
INSERT INTO endpoints (
    id, service_id, endpoint_name, http_method, relative_path,
    upstream_path_template, is_enabled, timeout_ms, max_retries,
    idempotent_only, request_size_limit_bytes, response_size_limit_bytes,
    payload_expectation, headers_to_add,
    crypto_algorithm, key_source, iv_source, encoding, require_iv
)
SELECT
    gen_random_uuid(),
    service.id,
    'name-enquiry', 'POST', '/name-enquiry',
    '/api/v1/name-enquiry', true, 10000, 0,
    true, 524288, 1048576,
    'Encrypted', '{"X-Service-Version": "v1"}'::jsonb,
    NULL, NULL, NULL, NULL, NULL
FROM service;

-- 2. transfer (expects decrypted payload, override to AES_256_CBC_HMAC)
WITH service AS (
    SELECT id FROM services WHERE service_name = 'PayHub' AND version = 'v1' LIMIT 1
)
INSERT INTO endpoints (
    id, service_id, endpoint_name, http_method, relative_path,
    upstream_path_template, is_enabled, timeout_ms, max_retries,
    idempotent_only, request_size_limit_bytes, response_size_limit_bytes,
    payload_expectation, headers_to_add,
    crypto_algorithm, key_source, iv_source, encoding, require_iv
)
SELECT
    gen_random_uuid(),
    service.id,
    'transfer', 'POST', '/transfer',
    '/api/v1/transfer', true, 30000, 0,
    false, 1048576, 2097152,
    'Decrypted', '{"X-Service-Version": "v1", "X-Idempotency-Required": "false"}'::jsonb,
    'AES_256_CBC_HMAC', 'UserProfileKey', 'UserProfileIv', 'Base64', true
FROM service;

-- 3. balance-enquiry (expects decrypted payload)
WITH service AS (
    SELECT id FROM services WHERE service_name = 'PayHub' AND version = 'v1' LIMIT 1
)
INSERT INTO endpoints (
    id, service_id, endpoint_name, http_method, relative_path,
    upstream_path_template, is_enabled, timeout_ms, max_retries,
    idempotent_only, request_size_limit_bytes, response_size_limit_bytes,
    payload_expectation, headers_to_add,
    crypto_algorithm, key_source, iv_source, encoding, require_iv
)
SELECT
    gen_random_uuid(),
    service.id,
    'balance-enquiry', 'POST,GET', '/balance-enquiry',
    '/api/v1/balance', true, 15000, 2,
    true, 262144, 524288,
    'Decrypted', '{"X-Service-Version": "v1"}'::jsonb,
    NULL, NULL, NULL, NULL, NULL
FROM service;

-- Insert Clients
INSERT INTO clients (id, client_id, client_name, client_secret, is_enabled)
VALUES
    (gen_random_uuid(), 'mobile-app-001', 'Mobile Banking App',
     '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5xkdXC0rL3zDu', true),
    (gen_random_uuid(), 'web-portal-001', 'Web Banking Portal',
     '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true);

-- Insert User Profiles (crypto keys for clients)
WITH service AS (
    SELECT id FROM services WHERE service_name = 'PayHub' AND version = 'v1' LIMIT 1
)
INSERT INTO user_profiles (id, user_id, service_id, encryption_key, encryption_iv, is_enabled)
VALUES
    (gen_random_uuid(), 'mobile-app-001', (SELECT id FROM service),
     'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=', 'AAAAAAAAAAAAAAAAAAAAAA==', true),
    (gen_random_uuid(), 'web-portal-001', (SELECT id FROM service),
     'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', 'BBBBBBBBBBBBBBBBBBBBBB==', true);

-- Insert Client Permissions
-- Mobile app can access all PayHub endpoints
INSERT INTO client_permissions (id, client_id, endpoint_id, is_enabled)
SELECT gen_random_uuid(), c.id, e.id, true
FROM clients c
JOIN endpoints e ON true
JOIN services s ON e.service_id = s.id
WHERE c.client_id = 'mobile-app-001'
  AND s.service_name = 'PayHub'
  AND s.version = 'v1'
ON CONFLICT DO NOTHING;

-- Web portal can only access name-enquiry and balance-enquiry
INSERT INTO client_permissions (id, client_id, endpoint_id, is_enabled)
SELECT gen_random_uuid(), c.id, e.id, true
FROM clients c
JOIN endpoints e ON true
JOIN services s ON e.service_id = s.id
WHERE c.client_id = 'web-portal-001'
  AND s.service_name = 'PayHub'
  AND s.version = 'v1'
  AND e.endpoint_name IN ('name-enquiry', 'balance-enquiry')
ON CONFLICT DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE products IS 'Top-level product grouping for services';
COMMENT ON TABLE services IS 'Service registry with upstream config and default policies';
COMMENT ON TABLE endpoints IS 'Individual API endpoints with specific policies and crypto overrides';
COMMENT ON TABLE clients IS 'API clients that can access the gateway';
COMMENT ON TABLE client_permissions IS 'Granular permissions mapping clients to endpoints';
COMMENT ON TABLE user_profiles IS 'Client-specific encryption keys and IVs';
