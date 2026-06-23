-- Gateway API Database Schema
-- PostgreSQL 15+

SET search_path TO "SeaBaasAPIGateway-Core";

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    owner_team VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_name ON products(name) WHERE is_enabled = true;

-- Services table
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    service_name VARCHAR(100) NOT NULL,
    base_path VARCHAR(200) NOT NULL,
    version VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    owner_team VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    environment VARCHAR(20) NOT NULL DEFAULT 'dev',
    
    -- Upstream config
    cluster_id VARCHAR(100) NOT NULL,
    destinations JSONB NOT NULL, -- Array of upstream URLs
    load_balancing_policy VARCHAR(50) NOT NULL DEFAULT 'RoundRobin',
    health_check_enabled BOOLEAN NOT NULL DEFAULT false,
    health_check_path VARCHAR(200),
    health_check_interval_seconds INT NOT NULL DEFAULT 30,
    
    -- Observability
    enable_tracing BOOLEAN NOT NULL DEFAULT true,
    enable_metrics BOOLEAN NOT NULL DEFAULT true,
    log_sampling DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    
    -- Security
    requires_jwt BOOLEAN NOT NULL DEFAULT true,
    required_scopes JSONB, -- Array of required scopes
    allowed_clients JSONB, -- Array of allowed client IDs
    
    -- Caching
    cache_enabled BOOLEAN NOT NULL DEFAULT false,
    cache_ttl_seconds INT NOT NULL DEFAULT 60,
    cache_key_template VARCHAR(200),
    
    -- Kafka eventing
    emit_events BOOLEAN NOT NULL DEFAULT false,
    topic_prefix VARCHAR(100),
    event_schema_version VARCHAR(20),
    
    -- Default crypto config
    default_crypto_algorithm VARCHAR(50) NOT NULL DEFAULT 'AES_256_GCM',
    default_key_source VARCHAR(50) NOT NULL DEFAULT 'UserProfileKey',
    default_iv_source VARCHAR(50) NOT NULL DEFAULT 'UserProfileIv',
    default_encoding VARCHAR(20) NOT NULL DEFAULT 'Base64',
    default_require_iv BOOLEAN NOT NULL DEFAULT true,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(product_id, service_name, version)
);

CREATE INDEX idx_services_base_path ON services(base_path) WHERE is_enabled = true;
CREATE INDEX idx_services_cluster ON services(cluster_id);

-- Endpoints table
CREATE TABLE IF NOT EXISTS endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    endpoint_name VARCHAR(100) NOT NULL,
    http_method VARCHAR(50) NOT NULL, -- Can be comma-separated: GET,POST
    relative_path VARCHAR(200) NOT NULL,
    upstream_path_template VARCHAR(200),
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    timeout_ms INT NOT NULL DEFAULT 30000,
    max_retries INT NOT NULL DEFAULT 0,
    idempotent_only BOOLEAN NOT NULL DEFAULT true,
    request_size_limit_bytes INT NOT NULL DEFAULT 1048576, -- 1MB
    response_size_limit_bytes INT NOT NULL DEFAULT 10485760, -- 10MB
    
    -- Endpoint-specific policies
    payload_expectation VARCHAR(20) NOT NULL DEFAULT 'Encrypted',
    headers_to_add JSONB,
    headers_to_remove JSONB,
    rate_limit_policy JSONB,
    
    -- Crypto override (NULL uses service default)
    crypto_algorithm VARCHAR(50),
    key_source VARCHAR(50),
    iv_source VARCHAR(50),
    encoding VARCHAR(20),
    require_iv BOOLEAN,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(service_id, endpoint_name)
);

CREATE INDEX idx_endpoints_service ON endpoints(service_id) WHERE is_enabled = true;
CREATE INDEX idx_endpoints_path ON endpoints(service_id, relative_path);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id VARCHAR(100) NOT NULL UNIQUE,
    client_name VARCHAR(200) NOT NULL,
    client_secret VARCHAR(500) NOT NULL, -- BCrypt hashed
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    allowed_ip_addresses JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP
);

CREATE INDEX idx_clients_client_id ON clients(client_id) WHERE is_enabled = true;

-- Client permissions table
CREATE TABLE IF NOT EXISTS client_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    endpoint_id UUID NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    
    UNIQUE(client_id, endpoint_id)
);

CREATE INDEX idx_client_permissions_client ON client_permissions(client_id) WHERE is_enabled = true;
CREATE INDEX idx_client_permissions_endpoint ON client_permissions(endpoint_id) WHERE is_enabled = true;

-- User profiles (crypto keys/IVs per client/user)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(100) NOT NULL, -- ClientId or user identifier
    service_id UUID REFERENCES services(id) ON DELETE CASCADE, -- NULL means global
    encryption_key TEXT NOT NULL, -- Base64 encoded AES key
    encryption_iv TEXT, -- Base64 encoded IV
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, service_id)
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id) WHERE is_enabled = true;
CREATE INDEX idx_user_profiles_service ON user_profiles(service_id) WHERE is_enabled = true;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_endpoints_updated_at BEFORE UPDATE ON endpoints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
