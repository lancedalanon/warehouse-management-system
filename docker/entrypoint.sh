#!/bin/sh
set -e

echo "Starting backend container..."

echo "Waiting for database..."

# Wait until the database is ready
until node -e "
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
client.connect().then(() => process.exit(0)).catch(() => process.exit(1));
"
do
  echo "Database not ready..."
  sleep 2
done

echo "Running migrations..."
node ./node_modules/typeorm/cli.js migration:run -d dist/data-source.js || echo "Migrations failed or already applied"

# Ensure storage folder exists and is writable
mkdir -p /app/storage
chmod -R 777 /app/storage

echo "Starting server..."
exec node dist/index.js