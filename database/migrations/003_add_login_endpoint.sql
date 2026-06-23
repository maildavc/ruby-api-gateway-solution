-- Add login endpoint for testing with AES-128-CBC encryption

SET search_path TO "SeaBaasAPIGateway-Core";

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert login endpoint
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
    'login',
    'POST',
    '/login',
    '/api/v1/auth/login',
    true,
    15000,
    0,
    true,
    1048576,
    1048576,
    'Decrypted',
    '{"X-Service-Version": "v1"}'::jsonb,
    'AES_128_CBC',
    'UserProfileKey',
    'UserProfileIv',
    'Base64',
    true
FROM service;

-- Update mobile-app-001 crypto keys for testing
-- Key: 'zAL7X5AVRm8l4Ifs' (16 bytes) -> Base64: 'ekFMN1g1QVZSbThsNElmcw=='
-- IV: 'BE/s3V0HtpPsE+1x' (16 bytes) -> Base64: 'QkUvczNWMEh0cFBzRSsxeA=='

WITH service AS (
    SELECT id FROM services WHERE service_name = 'PayHub' AND version = 'v1' LIMIT 1
)
UPDATE user_profiles
SET
    encryption_key = 'ekFMN1g1QVZSbThsNElmcw==',  -- 'zAL7X5AVRm8l4Ifs' in Base64
    encryption_iv = 'QkUvczNWMEh0cFBzRSsxeA=='    -- 'BE/s3V0HtpPsE+1x' in Base64
WHERE user_id = 'mobile-app-001' AND service_id = (SELECT id FROM service);

-- Grant mobile-app-001 permission to login endpoint
INSERT INTO client_permissions (id, client_id, endpoint_id, is_enabled)
SELECT gen_random_uuid(), c.id, e.id, true
FROM clients c, endpoints e
WHERE c.client_id = 'mobile-app-001'
AND e.service_id = (SELECT id FROM services WHERE service_name = 'PayHub' AND version = 'v1' LIMIT 1)
AND e.endpoint_name = 'login'
ON CONFLICT DO NOTHING;

-- Verify the setup
SELECT 
    e.endpoint_name,
    e.http_method,
    e.relative_path,
    e.payload_expectation,
    e.crypto_algorithm,
    u.user_id,
    u.encryption_key,
    u.encryption_iv
FROM endpoints e
JOIN user_profiles u ON u.service_id = e.service_id
WHERE e.endpoint_name = 'login'
AND u.user_id = 'mobile-app-001';
