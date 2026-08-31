#!/bin/sh
set -eu

if ! psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --tuples-only --command "SELECT 1 FROM pg_database WHERE datname = 'evolution'" | grep -q 1; then
  psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --command 'CREATE DATABASE evolution'
fi
