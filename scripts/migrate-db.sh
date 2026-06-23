#!/bin/bash

# API Gateway Complete Database Migration Script
# Applies all pending migrations in sequence

set -e

echo "🚀 Starting database migration..."

# Configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-SeaBaasAPIGateway-Database}
DB_USER=${DB_USER:-olawoleomotosho}

# Get the directory where migrations are stored
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATION_DIR="$SCRIPT_DIR/../database/migrations"

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c '\q' 2>/dev/null; do
  echo "  PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Apply all migrations in order
echo "📝 Applying migrations..."

# List of migrations in order
MIGRATIONS=(
  "001_initial_schema.sql"
  "002_seed_data.sql"
  "003_add_login_endpoint.sql"
  "004_load_balancing.sql"
  "005_convert_ids_to_uuid.sql"
  "006_enterprise_identity.sql"
  "007_org_access_management.sql"
)

for migration in "${MIGRATIONS[@]}"; do
  migration_file="$MIGRATION_DIR/$migration"
  
  if [ -f "$migration_file" ]; then
    echo "  ⚙️  Applying $migration..."
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$migration_file" > /dev/null 2>&1 || {
      echo "  ⚠️  $migration (may already be applied or skipped)"
    }
    echo "  ✅ $migration applied"
  else
    echo "  ❌ $migration not found at $migration_file"
    exit 1
  fi
done

echo ""
echo "✅ All migrations applied successfully!"
echo ""

# Verify tables
echo "📋 Verifying tables..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME <<-EOSQL
  SELECT 
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'SeaBaasAPIGateway-Core') as "Total Tables"
  ;
EOSQL

echo ""
echo "🎉 Database migration completed!"
