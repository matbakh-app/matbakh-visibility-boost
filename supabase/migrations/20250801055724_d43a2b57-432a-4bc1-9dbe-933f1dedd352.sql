-- Database Transaction Function for Promo Code Redemption
CREATE OR REPLACE FUNCTION public.redeem_promo_code_transaction(
  p_promo_code_id UUID,
  p_user_id UUID,
  p_granted_features JSONB,
  p_granted_role TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_usage INTEGER;
  max_usage INTEGER;
BEGIN
  -- Lock the promo code row to prevent race conditions
  SELECT current_uses, max_uses 
  INTO current_usage, max_usage
  FROM public.promo_codes 
  WHERE id = p_promo_code_id 
  FOR UPDATE;

  -- Double check availability
  IF current_usage >= max_usage THEN
    RAISE EXCEPTION 'Promo code is fully used';
  END IF;

  -- Insert usage record
  INSERT INTO public.promo_code_usage (promo_code_id, user_id)
  VALUES (p_promo_code_id, p_user_id);

  -- Update usage counter
  UPDATE public.promo_codes 
  SET current_uses = current_uses + 1,
      updated_at = NOW()
  WHERE id = p_promo_code_id;

  -- Update user profile with granted features and role
  INSERT INTO public.user_profiles (
    id, 
    granted_features, 
    feature_access_until, 
    role,
    subscription_status
  ) 
  VALUES (
    p_user_id,
    p_granted_features,
    NOW() + INTERVAL '12 months', -- 1 Jahr Zugriff
    CASE WHEN p_granted_role != 'user' THEN p_granted_role::user_role ELSE 'user'::user_role END,
    CASE WHEN p_granted_role = 'business_partner' THEN 'premium' ELSE 'free' END
  )
  ON CONFLICT (id) DO UPDATE SET
    granted_features = EXCLUDED.granted_features,
    feature_access_until = EXCLUDED.feature_access_until,
    role = CASE 
      WHEN EXCLUDED.role != 'user'::user_role THEN EXCLUDED.role 
      ELSE user_profiles.role 
    END,
    subscription_status = CASE 
      WHEN EXCLUDED.subscription_status != 'free' THEN EXCLUDED.subscription_status 
      ELSE user_profiles.subscription_status 
    END,
    updated_at = NOW();

EXCEPTION WHEN OTHERS THEN
  -- Re-raise the exception to rollback transaction
  RAISE;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.redeem_promo_code_transaction TO authenticated;