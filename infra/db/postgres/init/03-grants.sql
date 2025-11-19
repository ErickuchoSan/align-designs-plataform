-- Conceder permisos de uso y DML al usuario Alfonso sobre el esquema aligndesigns
GRANT USAGE ON SCHEMA aligndesigns TO "Alfonso";
ALTER DEFAULT PRIVILEGES IN SCHEMA aligndesigns
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO "Alfonso";