  CREATE OR REPLACE FUNCTION public.set_updated_at()
  RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
  $$ LANGUAGE plpgsql;

  -- by default all functions are accessible to the public, we need to remove that
  -- and define our specific access rules
  REVOKE ALL PRIVILEGES ON FUNCTION public.set_updated_at() FROM public;
  ALTER FUNCTION public.set_updated_at() OWNER TO postgres;
