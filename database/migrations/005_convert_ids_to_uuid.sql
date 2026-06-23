-- Migrate integer IDs to UUIDs (primary keys + foreign keys)
-- Run once on existing database

SET search_path TO "SeaBaasAPIGateway-Core";

CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

-- Add UUID columns
ALTER TABLE products ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();
ALTER TABLE services ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();
ALTER TABLE services ADD COLUMN IF NOT EXISTS product_id_uuid UUID;
ALTER TABLE endpoints ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();
ALTER TABLE endpoints ADD COLUMN IF NOT EXISTS service_id_uuid UUID;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();
ALTER TABLE client_permissions ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();
ALTER TABLE client_permissions ADD COLUMN IF NOT EXISTS client_id_uuid UUID;
ALTER TABLE client_permissions ADD COLUMN IF NOT EXISTS endpoint_id_uuid UUID;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS service_id_uuid UUID;
ALTER TABLE service_destinations ADD COLUMN IF NOT EXISTS id_uuid UUID DEFAULT gen_random_uuid();
ALTER TABLE service_destinations ADD COLUMN IF NOT EXISTS service_id_uuid UUID;

-- Populate UUID foreign keys
UPDATE services s SET product_id_uuid = p.id_uuid FROM products p WHERE s.product_id = p.id;
UPDATE endpoints e SET service_id_uuid = s.id_uuid FROM services s WHERE e.service_id = s.id;
UPDATE client_permissions cp SET client_id_uuid = c.id_uuid FROM clients c WHERE cp.client_id = c.id;
UPDATE client_permissions cp SET endpoint_id_uuid = e.id_uuid FROM endpoints e WHERE cp.endpoint_id = e.id;
UPDATE user_profiles up SET service_id_uuid = s.id_uuid FROM services s WHERE up.service_id = s.id;
UPDATE service_destinations sd SET service_id_uuid = s.id_uuid FROM services s WHERE sd.service_id = s.id;

-- Drop old constraints
ALTER TABLE client_permissions DROP CONSTRAINT IF EXISTS client_permissions_client_id_endpoint_id_key;
ALTER TABLE endpoints DROP CONSTRAINT IF EXISTS endpoints_service_id_endpoint_name_key;
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_product_id_service_name_version_key;
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_id_service_id_key;
ALTER TABLE service_destinations DROP CONSTRAINT IF EXISTS service_destinations_service_id_destination_name_key;

ALTER TABLE client_permissions DROP CONSTRAINT IF EXISTS client_permissions_client_id_fkey;
ALTER TABLE client_permissions DROP CONSTRAINT IF EXISTS client_permissions_endpoint_id_fkey;
ALTER TABLE endpoints DROP CONSTRAINT IF EXISTS endpoints_service_id_fkey;
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_product_id_fkey;
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_service_id_fkey;
ALTER TABLE service_destinations DROP CONSTRAINT IF EXISTS service_destinations_service_id_fkey;

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_pkey;
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_pkey;
ALTER TABLE endpoints DROP CONSTRAINT IF EXISTS endpoints_pkey;
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_pkey;
ALTER TABLE client_permissions DROP CONSTRAINT IF EXISTS client_permissions_pkey;
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_pkey;
ALTER TABLE service_destinations DROP CONSTRAINT IF EXISTS service_destinations_pkey;

-- Drop old integer columns and rename UUID columns
ALTER TABLE products DROP COLUMN IF EXISTS id;
ALTER TABLE products RENAME COLUMN id_uuid TO id;

ALTER TABLE services DROP COLUMN IF EXISTS product_id;
ALTER TABLE services DROP COLUMN IF EXISTS id;
ALTER TABLE services RENAME COLUMN id_uuid TO id;
ALTER TABLE services RENAME COLUMN product_id_uuid TO product_id;

ALTER TABLE endpoints DROP COLUMN IF EXISTS service_id;
ALTER TABLE endpoints DROP COLUMN IF EXISTS id;
ALTER TABLE endpoints RENAME COLUMN id_uuid TO id;
ALTER TABLE endpoints RENAME COLUMN service_id_uuid TO service_id;

ALTER TABLE clients DROP COLUMN IF EXISTS id;
ALTER TABLE clients RENAME COLUMN id_uuid TO id;

ALTER TABLE client_permissions DROP COLUMN IF EXISTS client_id;
ALTER TABLE client_permissions DROP COLUMN IF EXISTS endpoint_id;
ALTER TABLE client_permissions DROP COLUMN IF EXISTS id;
ALTER TABLE client_permissions RENAME COLUMN id_uuid TO id;
ALTER TABLE client_permissions RENAME COLUMN client_id_uuid TO client_id;
ALTER TABLE client_permissions RENAME COLUMN endpoint_id_uuid TO endpoint_id;

ALTER TABLE user_profiles DROP COLUMN IF EXISTS service_id;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS id;
ALTER TABLE user_profiles RENAME COLUMN id_uuid TO id;
ALTER TABLE user_profiles RENAME COLUMN service_id_uuid TO service_id;

ALTER TABLE service_destinations DROP COLUMN IF EXISTS service_id;
ALTER TABLE service_destinations DROP COLUMN IF EXISTS id;
ALTER TABLE service_destinations RENAME COLUMN id_uuid TO id;
ALTER TABLE service_destinations RENAME COLUMN service_id_uuid TO service_id;

-- Recreate primary keys
ALTER TABLE products ADD PRIMARY KEY (id);
ALTER TABLE services ADD PRIMARY KEY (id);
ALTER TABLE endpoints ADD PRIMARY KEY (id);
ALTER TABLE clients ADD PRIMARY KEY (id);
ALTER TABLE client_permissions ADD PRIMARY KEY (id);
ALTER TABLE user_profiles ADD PRIMARY KEY (id);
ALTER TABLE service_destinations ADD PRIMARY KEY (id);

-- Recreate foreign keys
ALTER TABLE services ADD CONSTRAINT services_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE endpoints ADD CONSTRAINT endpoints_service_id_fkey FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE;
ALTER TABLE client_permissions ADD CONSTRAINT client_permissions_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
ALTER TABLE client_permissions ADD CONSTRAINT client_permissions_endpoint_id_fkey FOREIGN KEY (endpoint_id) REFERENCES endpoints(id) ON DELETE CASCADE;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_service_id_fkey FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE;
ALTER TABLE service_destinations ADD CONSTRAINT service_destinations_service_id_fkey FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE;

-- Recreate unique constraints
ALTER TABLE services ADD CONSTRAINT services_product_id_service_name_version_key UNIQUE (product_id, service_name, version);
ALTER TABLE endpoints ADD CONSTRAINT endpoints_service_id_endpoint_name_key UNIQUE (service_id, endpoint_name);
ALTER TABLE client_permissions ADD CONSTRAINT client_permissions_client_id_endpoint_id_key UNIQUE (client_id, endpoint_id);
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_id_service_id_key UNIQUE (user_id, service_id);
ALTER TABLE service_destinations ADD CONSTRAINT service_destinations_service_id_destination_name_key UNIQUE (service_id, destination_name);

-- Recreate indexes
DROP INDEX IF EXISTS idx_services_base_path;
DROP INDEX IF EXISTS idx_services_cluster;
DROP INDEX IF EXISTS idx_endpoints_service;
DROP INDEX IF EXISTS idx_endpoints_path;
DROP INDEX IF EXISTS idx_client_permissions_client;
DROP INDEX IF EXISTS idx_client_permissions_endpoint;
DROP INDEX IF EXISTS idx_user_profiles_user_id;
DROP INDEX IF EXISTS idx_user_profiles_service;
DROP INDEX IF EXISTS idx_service_destinations_service_id;
DROP INDEX IF EXISTS idx_service_destinations_enabled;

CREATE INDEX idx_services_base_path ON services(base_path) WHERE is_enabled = true;
CREATE INDEX idx_services_cluster ON services(cluster_id);
CREATE INDEX idx_endpoints_service ON endpoints(service_id) WHERE is_enabled = true;
CREATE INDEX idx_endpoints_path ON endpoints(service_id, relative_path);
CREATE INDEX idx_client_permissions_client ON client_permissions(client_id) WHERE is_enabled = true;
CREATE INDEX idx_client_permissions_endpoint ON client_permissions(endpoint_id) WHERE is_enabled = true;
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id) WHERE is_enabled = true;
CREATE INDEX idx_user_profiles_service ON user_profiles(service_id) WHERE is_enabled = true;
CREATE INDEX idx_service_destinations_service_id ON service_destinations(service_id);
CREATE INDEX idx_service_destinations_enabled ON service_destinations(service_id, is_enabled);

COMMIT;
