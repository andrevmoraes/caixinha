-- ============================================
-- SCRIPT CORRETIVO - PERMITIR LOGIN INICIAL
-- ============================================
-- Execute este script para permitir login/cadastro
-- mesmo antes de configurar current_user_id
-- ============================================

-- Remover política antiga de SELECT
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_all_by_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_select_for_login" ON profiles;

-- Nova política: Permite SELECT em profiles para login
CREATE POLICY "profiles_select_for_login"
ON profiles
FOR SELECT
TO public
USING (
  -- Permite se ainda não está logado (string vazia ou null)
  -- IMPORTANTE: current_setting retorna '' (não NULL) quando não configurado
  -- Tentar converter '' para uuid causa erro 500, por isso checamos primeiro
  current_setting('app.current_user_id', true) = ''
  OR
  current_setting('app.current_user_id', true) IS NULL
  OR
  -- É o próprio usuário (só converte para uuid se não for vazio)
  (
    current_setting('app.current_user_id', true) != ''
    AND id = current_setting('app.current_user_id', true)::uuid
  )
  OR
  -- É admin
  (
    current_setting('app.current_user_id', true) != ''
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = current_setting('app.current_user_id', true)::uuid
      AND is_admin = true
    )
  )
);

-- ============================================
-- FIM DO SCRIPT CORRETIVO
-- ============================================

-- Verificar que a política foi criada:
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
