#!/usr/bin/env bash
set -euo pipefail

echo "Running Supabase setup script"

# Ensure SUPABASE_URL and POSTGRES_URL are set in environment or .env
: "${SUPABASE_URL?Please set SUPABASE_URL}
: ${POSTGRES_URL?Please set POSTGRES_URL or set POSTGRES_URL env var}"

# Create storage bucket
if command -v supabase >/dev/null 2>&1; then
  echo "Creating storage bucket 'car-photos' (if not exists)"
  supabase storage bucket create car-photos --public || true
else
  echo "supabase CLI not found — skipping bucket creation. Please create bucket 'car-photos' manually via Dashboard or install supabase CLI."
fi

# Apply SQL migration via psql
if command -v psql >/dev/null 2>&1; then
  echo "Applying SQL migration to database"
  psql "$POSTGRES_URL" -f supabase/migrations/001_init.sql
else
  echo "psql not found — please apply supabase/migrations/001_init.sql via psql or Supabase SQL Editor"
fi

echo "Setup complete. Verify bucket and tables in Supabase dashboard."
