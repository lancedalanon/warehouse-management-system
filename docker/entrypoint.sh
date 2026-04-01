#!/bin/sh
set -e

echo "Starting backend container..."

# Optionally wait for database availability
# echo "Waiting for Postgres..."
# until pg_isready -h $DB_HOST -p $DB_PORT; do
#   sleep 1
# done

# Run TypeORM migrations
echo "Running migrations..."
npm run db:migrate || true

# Run seeders if you have any
# npx ts-node ./src/seeders/seed.ts || true

# Ensure storage folder exists and is writable
mkdir -p /app/storage
chmod -R 777 /app/storage

# Start the backend
exec node dist/index.js