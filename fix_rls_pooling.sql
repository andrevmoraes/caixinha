-- ============================================
-- FIX: Problema de RLS com Connection Pooling
-- ============================================
-- Este script corrige o problema onde app.is_admin
-- não está sendo configurado corretamente devido ao
-- connection pooling do Supabase.
--
-- SINTOMA: Admin não vê pagamentos (retorna 0)
-- CAUSA: Cada conexão do pool precisa reconfigurar RLS
--
-- COMO APLICAR:
-- 1. Acesse: https://supabase.com/dashboard
-- 2. Abra o projeto
-- 3. Vá em "SQL Editor"
-- 4. Cole este script
-- 5. Clique em "RUN"
-- ============================================

-- Opção 1: Melhorar a função set_current_user_id
-- ============================================
CREATE OR REPLACE FUNCTION set_current_user_id(user_id uuid)
RETURNS TABLE(configured_user_id text, configured_is_admin text) AS $$
DECLARE
  user_is_admin boolean;
BEGIN
  -- Configura user_id
  PERFORM set_config('app.current_user_id', user_id::text, false);
  
  -- Busca se é admin
  SELECT is_admin INTO user_is_admin FROM profiles WHERE id = user_id;
  
  -- Garante valor não nulo
  IF user_is_admin IS NULL THEN
    user_is_admin := false;
  END IF;
  
  -- Configura is_admin
  PERFORM set_config('app.is_admin', user_is_admin::text, false);
  
  -- Retorna os valores configurados para verificação
  RETURN QUERY SELECT 
    current_setting('app.current_user_id', true),
    current_setting('app.is_admin', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Opção 2: Criar função auxiliar para verificar configuração
-- ============================================
CREATE OR REPLACE FUNCTION get_current_rls_config()
RETURNS TABLE(user_id text, is_admin text, user_exists boolean) AS $$
DECLARE
  uid text;
  is_adm text;
  usr_exists boolean;
BEGIN
  uid := current_setting('app.current_user_id', true);
  is_adm := current_setting('app.is_admin', true);
  
  -- Verifica se o usuário existe
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id::text = uid) INTO usr_exists;
  
  RETURN QUERY SELECT uid, is_adm, usr_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Opção 3: Política RLS alternativa (mais permissiva para admin)
-- ============================================
-- Esta é uma solução alternativa caso a configuração de contexto
-- não funcione consistentemente

-- IMPORTANTE: Só aplique se o problema persistir após outras tentativas

/*
-- Remove política atual
DROP POLICY IF EXISTS "payments_select_own" ON payments;

-- Cria nova política com verificação direta no perfil
CREATE POLICY "payments_select_own"
ON payments FOR SELECT TO public
USING (
  -- Usuário vê seus próprios pagamentos
  user_id::text = current_setting('app.current_user_id', true)
  OR
  -- OU admin vê tudo (verifica direto na tabela profiles)
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id::text = current_setting('app.current_user_id', true)
    AND is_admin = true
  )
);
*/

-- Teste a configuração
-- ============================================
SELECT 'Testando configuração RLS...' as teste;

-- Configure com seu user_id
SELECT * FROM set_current_user_id('c9ce073a-ff27-4e8f-ab03-949160beaac6'::uuid);

-- Verifique a configuração
SELECT * FROM get_current_rls_config();

-- Teste a query
SELECT COUNT(*) as total_payments FROM payments;

-- Se retornar 48, está funcionando!
SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM payments) = 48 THEN '✅ FUNCIONANDO! Admin vê todos os pagamentos'
    WHEN (SELECT COUNT(*) FROM payments) = 0 THEN '❌ PROBLEMA! Admin não está vendo pagamentos'
    ELSE '⚠️ PARCIAL: Admin vê alguns pagamentos mas não todos'
  END as resultado;

-- ============================================
-- NOTAS IMPORTANTES:
-- ============================================
-- 1. A função set_current_user_id agora RETORNA os valores
--    configurados, permitindo debug no JavaScript
--
-- 2. A função get_current_rls_config() permite verificar
--    a qualquer momento qual é a configuração atual
--
-- 3. A política RLS alternativa (comentada) faz uma
--    verificação direta no banco, evitando depender
--    do contexto da sessão
--
-- 4. Depois de aplicar, teste com:
--    SELECT * FROM set_current_user_id('seu-uuid'::uuid);
--    SELECT * FROM get_current_rls_config();
--    SELECT COUNT(*) FROM payments;
-- ============================================
