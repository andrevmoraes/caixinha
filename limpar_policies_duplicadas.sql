-- ============================================
-- LIMPEZA: REMOVER POLÍTICAS DUPLICADAS
-- ============================================

-- Há 3 políticas de INSERT na tabela payments, vamos limpar isso

DROP POLICY IF EXISTS "Allow insert for all authenticated" ON payments;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON payments;
DROP POLICY IF EXISTS "payments_insert_own" ON payments;
DROP POLICY IF EXISTS "payments_select_own" ON payments;
DROP POLICY IF EXISTS "payments_update_any" ON payments;

-- Recriar corretamente (uma de cada tipo)
CREATE POLICY "payments_insert_own"
ON payments FOR INSERT TO public
WITH CHECK (
  current_setting('app.current_user_id', true) IS NOT NULL
  AND current_setting('app.current_user_id', true) != ''
  AND user_id::text = current_setting('app.current_user_id', true)
);

CREATE POLICY "payments_select_own"
ON payments FOR SELECT TO public
USING (
  user_id::text = current_setting('app.current_user_id', true)
  OR current_setting('app.is_admin', true) = 'true'
);

CREATE POLICY "payments_update_any"
ON payments FOR UPDATE TO public
USING (
  (user_id::text = current_setting('app.current_user_id', true) AND status = 'pending')
  OR current_setting('app.is_admin', true) = 'true'
)
WITH CHECK (
  (user_id::text = current_setting('app.current_user_id', true) AND status = 'pending')
  OR current_setting('app.is_admin', true) = 'true'
);

-- Verificar
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'payments'
ORDER BY cmd, policyname;
