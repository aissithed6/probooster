-- MIGRATION : 20260909000006_protect_super_admin.sql
-- Protège le rôle et les comptes super_admin contre toute modification par un simple admin.
-- - Un admin peut gérer les rôles et attributions des AUTRES utilisateurs.
-- - Le rôle super_admin, ses permissions et ses comptes ne peuvent être modifiés
--   QUE par un super_admin (vérifié en base via triggers + policies RLS).
-- Idempotent.

-- 1. Helper : l'appelant authentifié courant est-il super_admin ?
CREATE OR REPLACE FUNCTION public.caller_is_super_admin() RETURNS BOOLEAN
LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'super_admin'
  );
$$;

-- 2. RLS role_definitions : lecture pour tous les authentifiés,
--    écriture pour super_admin OU admin (le trigger bloque le rôle super_admin pour les admins).
DROP POLICY IF EXISTS "Super Admin can manage role_definitions" ON public.role_definitions;
CREATE POLICY "Super or admin can manage role_definitions" ON public.role_definitions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super_admin','admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super_admin','admin')));

-- 3. Trigger role_definitions : bloque toute écriture touchant le rôle super_admin par un non-super_admin.
CREATE OR REPLACE FUNCTION public.protect_super_admin_role() RETURNS TRIGGER AS $$
BEGIN
  IF auth.role() = 'service_role' OR public.caller_is_super_admin() THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF (TG_OP = 'INSERT' AND NEW.role_code = 'super_admin')
     OR (TG_OP = 'UPDATE' AND (OLD.role_code = 'super_admin' OR NEW.role_code = 'super_admin'))
     OR (TG_OP = 'DELETE' AND OLD.role_code = 'super_admin') THEN
    RAISE EXCEPTION 'Action non autorisée : le rôle super_admin ne peut être modifié que par un super administrateur.';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS protect_super_admin_role_trigger ON public.role_definitions;
CREATE TRIGGER protect_super_admin_role_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON public.role_definitions
  FOR EACH ROW EXECUTE FUNCTION public.protect_super_admin_role();

-- 4. RLS user_role_code_assignments :
--    - lecture : ses propres attributions + les admins/super_admins lisent tout ;
--    - écriture : super_admin OU admin (le trigger bloque le rôle super_admin et les comptes super_admin).
DROP POLICY IF EXISTS "Super Admin can manage user_role_code_assignments" ON public.user_role_code_assignments;
CREATE POLICY "Super or admin can manage user_role_code_assignments" ON public.user_role_code_assignments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super_admin','admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super_admin','admin')));

DROP POLICY IF EXISTS "Users can read own role assignments" ON public.user_role_code_assignments;
CREATE POLICY "Users can read own role assignments" ON public.user_role_code_assignments FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 5. Trigger user_role_code_assignments : bloque
--    - l'attribution du rôle super_admin par un non-super_admin ;
--    - toute modification des attributions d'un compte super_admin par un non-super_admin.
CREATE OR REPLACE FUNCTION public.protect_super_admin_assignments() RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
BEGIN
  IF auth.role() = 'service_role' OR public.caller_is_super_admin() THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  target_user_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.user_id ELSE NEW.user_id END;

  IF (TG_OP = 'INSERT' AND NEW.role_code = 'super_admin')
     OR (TG_OP = 'UPDATE' AND (OLD.role_code = 'super_admin' OR NEW.role_code = 'super_admin'))
     OR (TG_OP = 'DELETE' AND OLD.role_code = 'super_admin') THEN
    RAISE EXCEPTION 'Action non autorisée : le rôle super_admin ne peut être attribué que par un super administrateur.';
  END IF;

  IF target_user_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = target_user_id AND u.role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Action non autorisée : les rôles d''un super administrateur ne peuvent être modifiés que par un super administrateur.';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS protect_super_admin_assignments_trigger ON public.user_role_code_assignments;
CREATE TRIGGER protect_super_admin_assignments_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON public.user_role_code_assignments
  FOR EACH ROW EXECUTE FUNCTION public.protect_super_admin_assignments();

-- 6. Trigger users : un non-super_admin ne peut ni modifier ni supprimer un compte super_admin,
--    ni promouvoir quelqu'un vers super_admin.
CREATE OR REPLACE FUNCTION public.protect_super_admin_user() RETURNS TRIGGER AS $$
BEGIN
  IF auth.role() = 'service_role' OR public.caller_is_super_admin() THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF (TG_OP = 'UPDATE' AND (OLD.role = 'super_admin' OR NEW.role = 'super_admin'))
     OR (TG_OP = 'DELETE' AND OLD.role = 'super_admin') THEN
    RAISE EXCEPTION 'Action non autorisée : les comptes super_admin ne peuvent être modifiés que par un super administrateur.';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS protect_super_admin_user_trigger ON public.users;
CREATE TRIGGER protect_super_admin_user_trigger
  BEFORE UPDATE OR DELETE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.protect_super_admin_user();
