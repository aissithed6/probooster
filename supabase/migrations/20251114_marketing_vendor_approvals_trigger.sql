-- Empêcher les vendeurs de modifier les colonnes d'approbation des campagnes de boost
-- Colonnes protégées: super_admin_approved, admin_approved, approved_by_super_admin, approved_by_admin, approved_at

-- Supprimer la fonction/trigger existants si présents pour permettre la ré-exécution de la migration
DROP TRIGGER IF EXISTS trg_prevent_vendor_approvals_update ON public.boosting_campaigns;
DROP FUNCTION IF EXISTS public.prevent_vendor_approvals_update();

-- Créer la fonction de trigger
CREATE FUNCTION public.prevent_vendor_approvals_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  is_admin boolean;
BEGIN
  -- Récupérer l'UID du JWT (null pour service role/SSR)
  uid := auth.uid();

  -- Si appel serveur/service (uid null), laisser passer (les policies RLS régulent déjà l'accès)
  IF uid IS NULL THEN
    RETURN NEW;
  END IF;

  -- Vérifier si l'utilisateur est admin ou super_admin
  SELECT (u.role IN ('admin','super_admin')) INTO is_admin
  FROM public.users u
  WHERE u.id = uid
  LIMIT 1;

  IF COALESCE(is_admin, FALSE) THEN
    RETURN NEW; -- Admins et super admins autorisés
  END IF;

  -- Pour les vendeurs/autres: interdire toute modification des colonnes d'approbation
  IF NEW.super_admin_approved IS DISTINCT FROM OLD.super_admin_approved
     OR NEW.admin_approved IS DISTINCT FROM OLD.admin_approved
     OR NEW.approved_by_super_admin IS DISTINCT FROM OLD.approved_by_super_admin
     OR NEW.approved_by_admin IS DISTINCT FROM OLD.approved_by_admin
     OR NEW.approved_at IS DISTINCT FROM OLD.approved_at THEN
    RAISE EXCEPTION 'Modification des colonnes d''approbation interdite pour les vendeurs';
  END IF;

  RETURN NEW;
END;
$$;

-- Créer le trigger BEFORE UPDATE
CREATE TRIGGER trg_prevent_vendor_approvals_update
BEFORE UPDATE ON public.boosting_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.prevent_vendor_approvals_update();
