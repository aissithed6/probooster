-- MIGRATION : 20260909000000_add_new_roles.sql
-- Ajoute les nouveaux rôles pour les attributions du Super Admin

DO $$
BEGIN
  -- Supprimer la contrainte existante
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_role_check'
  ) THEN
    EXECUTE 'ALTER TABLE public.users DROP CONSTRAINT users_role_check';
  END IF;
END $$;

ALTER TABLE public.users
ADD CONSTRAINT users_role_check
CHECK (
  role IN (
    'client',
    'vendor',
    'admin',
    'super_admin',
    'driver',
    'ops',
    'order_manager',
    'delivery_supervisor',
    'marketing_manager',
    'finance_manager'
  )
);