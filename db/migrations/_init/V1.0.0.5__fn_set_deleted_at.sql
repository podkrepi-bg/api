CREATE OR REPLACE FUNCTION public.set_deleted_at() RETURNS TRIGGER AS
  $$
  DECLARE
    table_name     TEXT DEFAULT quote_ident(TG_TABLE_SCHEMA) || '.' || quote_ident(TG_TABLE_NAME);
  BEGIN
    EXECUTE 'UPDATE ' || table_name || ' SET deleted_at = $1 WHERE id = $2'
    USING now(), old.id;
    RETURN NULL;
  END;
$$
LANGUAGE plpgsql;
-- by default all functions are accessible to the public, we need to remove that
-- and define our specific access rules
REVOKE ALL PRIVILEGES ON FUNCTION public.set_deleted_at() FROM public;
ALTER FUNCTION public.set_deleted_at() OWNER TO postgres;
