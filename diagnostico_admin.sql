-- ============================================
-- DIAGNÓSTICO: VERIFICAR CONFIGURAÇÕES DE ADMIN
-- ============================================
-- Use este script para diagnosticar problemas com
-- o painel de administrador não mostrando dados.
--
-- COMO USAR:
-- 1. Acesse: https://supabase.com/dashboard
-- 2. Abra o projeto
-- 3. Vá em "SQL Editor"
-- 4. Cole este script
-- 5. Clique em "RUN"
-- ============================================

-- 1. Verificar se RLS está ativo
SELECT 
  tablename,
  rowsecurity as "RLS Ativo?"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'payments', 'transactions')
ORDER BY tablename;

-- 2. Listar todas as políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Verificar usuários admin
SELECT 
  id,
  username,
  is_admin,
  created_at
FROM profiles
WHERE is_admin = true;

-- 4. Contar registros nas tabelas
SELECT 
  'profiles' as tabela,
  COUNT(*) as total
FROM profiles
UNION ALL
SELECT 
  'payments' as tabela,
  COUNT(*) as total
FROM payments
UNION ALL
SELECT 
  'transactions' as tabela,
  COUNT(*) as total
FROM transactions;

-- 5. Verificar se a função set_current_user_id existe
SELECT 
  proname as "Nome da Função",
  prosrc as "Código"
FROM pg_proc
WHERE proname = 'set_current_user_id';

-- 6. Verificar últimos pagamentos
SELECT 
  p.id,
  p.user_id,
  prof.username,
  p.month_ref,
  p.amount,
  p.status,
  p.created_at
FROM payments p
LEFT JOIN profiles prof ON p.user_id = prof.id
ORDER BY p.created_at DESC
LIMIT 10;

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- 1. Todas as tabelas devem ter RLS Ativo = true
-- 2. Deve haver múltiplas políticas para cada tabela
-- 3. Deve haver pelo menos 1 usuário com is_admin = true
-- 4. As contagens devem corresponder ao que você espera
-- 5. A função set_current_user_id deve existir
-- 6. Deve mostrar os pagamentos mais recentes
--
-- Se algo estiver faltando, execute:
-- supabase_security_policies.sql
-- ============================================
