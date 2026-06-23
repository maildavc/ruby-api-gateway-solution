#!/bin/bash

# Apply login endpoint migration

set -e

echo "🔧 Applying login endpoint migration..."

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-gateway}
DB_USER=${DB_USER:-gateway}
DB_PASSWORD=${DB_PASSWORD:-gateway123}

# Apply migration
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME < database/migrations/003_add_login_endpoint.sql

echo "✅ Migration applied successfully!"
echo ""
echo "Next step: Restart the gateway or trigger policy refresh"
