-- Inicialización de la base AlignDesignsDemo y esquema principal
-- POSTGRES_DB=AlignDesignsDemo será creado por la imagen oficial automáticamente

CREATE SCHEMA IF NOT EXISTS aligndesigns;


-- Extensiones útiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;