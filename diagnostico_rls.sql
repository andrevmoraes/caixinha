-- ============================================
-- DIAGNÓSTICO DAS FUNÇÕES E POLÍTICAS RLS
-- ============================================
-- Execute este script no Supabase SQL Editor para verificar o que está faltando

-- 1. Verificar se a função app_current_user_id existe
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name IN ('app_current_user_id', 'set_current_user_id', 'protect_is_admin_field');

-- 2. Verificar políticas ativas
SELECT 
  schemaname,
  tablename,
  policyname,
  CASE 
    WHEN cmd = 'r' THEN 'SELECT'
    WHEN cmd = 'a' THEN 'INSERT'
    WHEN cmd = 'w' THEN 'UPDATE'
    WHEN cmd = 'd' THEN 'DELETE'
    ELSE cmd 
  END as command,
  qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Verificar se RLS está ativo
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'payments', 'transactions');
