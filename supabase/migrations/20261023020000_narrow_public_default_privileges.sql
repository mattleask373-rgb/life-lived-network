-- Narrow default privileges for future public objects created by postgres.
--
-- The migration role can alter postgres-owned defaults in this local replay.
-- It cannot alter supabase_admin's default ACL: that role remains a separate
-- administrator-owned gate documented alongside issue #164.
--
-- This intentionally does not change grants on existing objects or RLS.

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;

-- PostgreSQL grants EXECUTE to PUBLIC on functions by default; revoke that
-- global default for future functions created by postgres.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated;
