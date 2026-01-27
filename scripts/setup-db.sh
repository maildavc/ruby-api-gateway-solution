#!/bin/bash

# API Gateway Database Setup Script
# This script initializes the PostgreSQL database with schema and seed data

set -e

echo "🚀 Starting database setup..."

# Configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-gateway}
DB_USER=${DB_USER:-gateway}
DB_PASSWORD=${DB_PASSWORD:-gateway123}

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c '\q' 2>/dev/null; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Create database if it doesn't exist
echo "📊 Creating database..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres <<-EOSQL
    SELECT 'CREATE DATABASE $DB_NAME'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec
EOSQL

# Apply schema migration
echo "🔧 Applying schema migration..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME < database/migrations/001_initial_schema.sql

# Apply seed data
echo "🌱 Applying seed data..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME < database/migrations/002_seed_data.sql

echo "✅ Database setup completed successfully!"

# Verify tables
echo "📋 Verifying tables..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME <<-EOSQL
    SELECT 'Products: ' || COUNT(*)::text FROM products;
    SELECT 'Services: ' || COUNT(*)::text FROM services;
    SELECT 'Endpoints: ' || COUNT(*)::text FROM endpoints;
    SELECT 'Clients: ' || COUNT(*)::text FROM clients;
    SELECT 'Permissions: ' || COUNT(*)::text FROM client_permissions;
    SELECT 'User Profiles: ' || COUNT(*)::text FROM user_profiles;
EOSQL

echo "✅ Setup complete! Gateway database is ready."
