-- Point PayHub service at the local MockServer container for dev/test.
-- The gateway runs on the host; MockServer is exposed on host port 8081.

SET search_path TO "SeaBaasAPIGateway-Core";

UPDATE services
SET destinations = '["http://localhost:8081"]'::jsonb
WHERE service_name = 'PayHub' AND version = 'v1';
