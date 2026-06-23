SET search_path TO "SeaBaasAPIGateway-Core";

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add advanced load balancing columns to services table
ALTER TABLE services ADD COLUMN IF NOT EXISTS session_affinity_enabled BOOLEAN DEFAULT false;
ALTER TABLE services ADD COLUMN IF NOT EXISTS session_affinity_cookie_name VARCHAR(100) DEFAULT 'gateway_affinity';
ALTER TABLE services ADD COLUMN IF NOT EXISTS session_affinity_ttl_seconds INTEGER DEFAULT 1800;

-- Circuit breaker settings
ALTER TABLE services ADD COLUMN IF NOT EXISTS circuit_breaker_enabled BOOLEAN DEFAULT false;
ALTER TABLE services ADD COLUMN IF NOT EXISTS circuit_breaker_threshold INTEGER DEFAULT 5;
ALTER TABLE services ADD COLUMN IF NOT EXISTS circuit_breaker_duration_seconds INTEGER DEFAULT 30;

-- Retry policy
ALTER TABLE services ADD COLUMN IF NOT EXISTS retry_enabled BOOLEAN DEFAULT true;
ALTER TABLE services ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 3;
ALTER TABLE services ADD COLUMN IF NOT EXISTS retry_delay_ms INTEGER DEFAULT 100;

-- Connection settings
ALTER TABLE services ADD COLUMN IF NOT EXISTS connection_timeout_seconds INTEGER DEFAULT 30;
ALTER TABLE services ADD COLUMN IF NOT EXISTS request_timeout_seconds INTEGER DEFAULT 60;
ALTER TABLE services ADD COLUMN IF NOT EXISTS max_connections_per_destination INTEGER DEFAULT 100;

-- Active/Passive health check mode
ALTER TABLE services ADD COLUMN IF NOT EXISTS passive_health_check_enabled BOOLEAN DEFAULT true;
ALTER TABLE services ADD COLUMN IF NOT EXISTS passive_health_failure_threshold INTEGER DEFAULT 3;
ALTER TABLE services ADD COLUMN IF NOT EXISTS passive_health_reactivation_seconds INTEGER DEFAULT 30;

-- Create a new table for individual destination configuration
CREATE TABLE IF NOT EXISTS service_destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    destination_name VARCHAR(100) NOT NULL,
    address VARCHAR(500) NOT NULL,
    weight INTEGER DEFAULT 1,
    priority INTEGER DEFAULT 0,
    is_enabled BOOLEAN DEFAULT true,
    health_status VARCHAR(20) DEFAULT 'Unknown',
    last_health_check TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(service_id, destination_name)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_service_destinations_service_id ON service_destinations(service_id);
CREATE INDEX IF NOT EXISTS idx_service_destinations_enabled ON service_destinations(service_id, is_enabled);

-- Migrate existing destinations from JSON to table
INSERT INTO service_destinations (service_id, destination_name, address)
SELECT 
    s.id,
    'destination' || row_number() OVER (PARTITION BY s.id ORDER BY dest.ordinality),
    dest.value::text
FROM services s
CROSS JOIN LATERAL jsonb_array_elements_text(s.destinations) WITH ORDINALITY AS dest(value, ordinality)
WHERE s.destinations IS NOT NULL 
  AND jsonb_array_length(s.destinations) > 0
ON CONFLICT (service_id, destination_name) DO NOTHING;
