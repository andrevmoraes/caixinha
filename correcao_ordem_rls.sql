-- ============================================
-- SCRIPT DE CORREÇÃO RÁPIDA - ORDEM CORRETA
-- ============================================
-- Este script recria TUDO na ordem certa para evitar erro 42704

-- PASSO 1: Remover TODAS as políticas primeiro (para evitar referências a funções inexistentes)
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_public" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_all_by_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_select_for_login" ON profiles;

DROP POLICY IF EXISTS "payments_select_own" ON payments;
DROP POLICY IF EXISTS "payments_insert_own" ON payments;
DROP POLICY IF EXISTS "payments_update_own" ON payments;
DROP POLICY IF EXISTS "payments_update_any" ON payments;
DROP POLICY IF EXISTS "payments_select_all_by_admin" ON payments;
DROP POLICY IF EXISTS "payments_update_by_admin" ON payments;

DROP POLICY IF EXISTS "transactions_select_all_by_admin" ON transactions;
DROP POLICY IF EXISTS "transactions_insert_by_admin" ON transactions;

-- PASSO 2: Criar as funções auxiliares
CREATE OR REPLACE FUNCTION app_current_user_id()
RETURNS uuid AS $$
DECLARE
  val text;
BEGIN
  val := current_setting('app.current_user_id', true);
  IF val IS NULL OR val = '' THEN
    RETURN NULL;
  END IF;
  RETURN val::uuid;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION set_current_user_id(user_id uuid)
RETURNS void AS $$
DECLARE
  user_is_admin boolean;
BEGIN
  PERFORM set_config('app.current_user_id', user_id::text, false);
  SELECT is_admin INTO user_is_admin FROM profiles WHERE id = user_id;
  PERFORM set_config('app.is_admin', COALESCE(user_is_admin, false)::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION protect_is_admin_field()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_admin IS DISTINCT FROM NEW.is_admin THEN
    IF current_setting('app.is_admin', true) != 'true' THEN
      RAISE EXCEPTION 'Apenas administradores podem alterar o campo is_admin';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASSO 3: Ativar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- PASSO 4: Criar políticas para profiles (agora as funções já existem!)
CREATE POLICY "profiles_insert_public"
ON profiles FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "profiles_select_for_login"
ON profiles FOR SELECT TO public
USING (
  current_setting('app.current_user_id', true) IS NULL
  OR current_setting('app.current_user_id', true) = ''
  OR id::text = current_setting('app.current_user_id', true)
  OR current_setting('app.is_admin', true) = 'true'
);

CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE TO public
USING (app_current_user_id() IS NOT NULL AND id = app_current_user_id())
WITH CHECK (app_current_user_id() IS NOT NULL AND id = app_current_user_id());

-- PASSO 5: Criar políticas para payments
CREATE POLICY "payments_select_own"
ON payments FOR SELECT TO public
USING (
  user_id = app_current_user_id()
  OR current_setting('app.is_admin', true) = 'true'
);

CREATE POLICY "payments_insert_own"
ON payments FOR INSERT TO public
WITH CHECK (
  app_current_user_id() IS NOT NULL
  AND user_id = app_current_user_id()
);

CREATE POLICY "payments_update_any"
ON payments FOR UPDATE TO public
USING (
  (user_id = app_current_user_id() AND status = 'pending')
  OR current_setting('app.is_admin', true) = 'true'
)
WITH CHECK (
  (user_id = app_current_user_id() AND status = 'pending')
  OR current_setting('app.is_admin', true) = 'true'
);

-- PASSO 6: Criar políticas para transactions
CREATE POLICY "transactions_select_all_by_admin"
ON transactions FOR SELECT TO public
USING (current_setting('app.is_admin', true) = 'true');

CREATE POLICY "transactions_insert_by_admin"
ON transactions FOR INSERT TO public
WITH CHECK (
  app_current_user_id() IS NOT NULL
  AND admin_id = app_current_user_id()
  AND current_setting('app.is_admin', true) = 'true'
);

-- PASSO 7: Criar trigger
DROP TRIGGER IF EXISTS protect_is_admin_trigger ON profiles;

CREATE TRIGGER protect_is_admin_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION protect_is_admin_field();

-- PASSO 8: Constraints de validação
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_username_safe;
ALTER TABLE profiles ADD CONSTRAINT profiles_username_safe
CHECK (username ~ '^[a-zA-Z0-9áàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ\s._-]+$');

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_pin_numeric;
ALTER TABLE profiles ADD CONSTRAINT profiles_pin_numeric
CHECK (pin ~ '^[0-9]{4}$');

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_amount_positive;
ALTER TABLE payments ADD CONSTRAINT payments_amount_positive
CHECK (amount > 0);

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_valor_positive;
ALTER TABLE transactions ADD CONSTRAINT transactions_valor_positive
CHECK (valor > 0);

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_descricao_not_empty;
ALTER TABLE transactions ADD CONSTRAINT transactions_descricao_not_empty
CHECK (char_length(trim(descricao)) > 0);

-- ✅ VERIFICAR SE FUNCIONOU
SELECT '✅ Funções criadas:' as status, count(*) as total
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name IN ('app_current_user_id', 'set_current_user_id', 'protect_is_admin_field')

UNION ALL

SELECT '✅ Políticas criadas:', count(*)
FROM pg_policies
WHERE schemaname = 'public';
