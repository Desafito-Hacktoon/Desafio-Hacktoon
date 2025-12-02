-- ./infra/db/init/001_enable_postgis.sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Opcional: índice espacial típico
-- CREATE INDEX IF NOT EXISTS idx_occurrences_geom ON occurrences USING GIST (geom);
