-- ============================================
-- SOLUÇÃO ALTERNATIVA: POLÍTICAS SEM FUNÇÃO AUXILIAR
-- ============================================
-- Se a função app_current_user_id() não estiver acessível,
-- use current_setting() diretamente nas políticas

-- PASSO 1: Remover política problemática
DROP POLICY IF EXISTS "payments_insert_own" ON payments;

-- PASSO 2: Recriar SEM usar a função auxiliar
CREATE POLICY "payments_insert_own"
ON payments FOR INSERT TO public
WITH CHECK (
  -- Verifica se há sessão E se o user_id bate com a sessão
  current_setting('app.current_user_id', true) IS NOT NULL
  AND current_setting('app.current_user_id', true) != ''
  AND user_id::text = current_setting('app.current_user_id', true)
);

-- PASSO 3: Fazer o mesmo com a política de SELECT se necessário
DROP POLICY IF EXISTS "payments_select_own" ON payments;

CREATE POLICY "payments_select_own"
ON payments FOR SELECT TO public
USING (
  user_id::text = current_setting('app.current_user_id', true)
  OR current_setting('app.is_admin', true) = 'true'
);

-- PASSO 4: E com UPDATE
DROP POLICY IF EXISTS "payments_update_any" ON payments;

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

-- VERIFICAR
SELECT 'Políticas de payments:' as info;
SELECT policyname, cmd, qual::text
FROM pg_policies
WHERE tablename = 'payments';
