-- Suivi de l'utilisation des promotions spéciales (Option 1)

CREATE TABLE IF NOT EXISTS public.special_promotion_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  special_promotion_id UUID REFERENCES public.special_promotions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  order_id UUID,
  product_id UUID,
  discount_amount DECIMAL(10,2) NOT NULL,
  original_amount DECIMAL(10,2) NOT NULL,
  final_amount DECIMAL(10,2) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_special_promotion_usage_promotion ON public.special_promotion_usage(special_promotion_id);
CREATE INDEX IF NOT EXISTS idx_special_promotion_usage_user ON public.special_promotion_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_special_promotion_usage_order ON public.special_promotion_usage(order_id);

ALTER TABLE public.special_promotion_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Utilisateurs voient leur utilisation special" ON public.special_promotion_usage;
DROP POLICY IF EXISTS "Admins voient toute utilisation special" ON public.special_promotion_usage;
DROP POLICY IF EXISTS "Utilisateurs enregistrent leur utilisation special" ON public.special_promotion_usage;

CREATE POLICY "Utilisateurs voient leur utilisation special" ON public.special_promotion_usage
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Utilisateurs enregistrent leur utilisation special" ON public.special_promotion_usage
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins voient toute utilisation special" ON public.special_promotion_usage
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'super_admin')
    )
  );

NOTIFY pgrst, 'reload schema';
