-- ============================================
-- SCRIPT DE TESTE - VERIFICAR FUNÇÃO
-- ============================================

-- 1. Testar se a função existe e funciona
SELECT 
  'Testando app_current_user_id()' as teste,
  app_current_user_id() as resultado;

-- 2. Testar configurando uma sessão
SELECT set_config('app.current_user_id', '00000000-0000-0000-0000-000000000000', false);
SELECT 
  'Após configurar sessão' as teste,
  app_current_user_id() as resultado;

-- 3. Verificar schema das funções
SELECT 
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname IN ('app_current_user_id', 'set_current_user_id')
ORDER BY p.proname;

-- 4. Ver o código SQL da política que está causando problema
SELECT 
  schemaname,
  tablename,
  policyname,
  qual::text as using_expression
FROM pg_policies
WHERE tablename = 'payments'
  AND policyname = 'payments_insert_own';
