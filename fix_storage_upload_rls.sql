-- ============================================
-- FIX RLS STORAGE: UPLOAD NO BUCKET receipts
-- ============================================
-- Causa raiz identificada:
-- - O app chama RPC set_current_user_id em uma requisicao
-- - O upload no Storage ocorre em outra requisicao/conexao
-- - Policies baseadas em current_setting('app.current_user_id')
--   podem nao enxergar o contexto nessa segunda conexao
--
-- Resultado: 403 "new row violates row-level security policy"
-- ============================================

-- 0) Ver politicas atuais
select schemaname, tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;

-- 1) Remover politicas de INSERT do bucket receipts que dependem de current_setting
-- Ajuste os nomes se no seu projeto estiverem diferentes
DROP POLICY IF EXISTS "Users can upload own receipts" ON storage.objects;
DROP POLICY IF EXISTS "users_can_upload_own_receipts" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Receipts insert by app.current_user_id" ON storage.objects;

-- 2) FIX IMEDIATO (destrava upload)
-- Permite upload para bucket receipts sem depender de contexto de sessao
-- ATENCAO: esta regra e funcional, mas mais permissiva.
CREATE POLICY "receipts_insert_temp_allow"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'receipts'
);

-- 3) Mantem leitura com restricao minima por pasta UUID (opcional)
-- Se voce ja tem SELECT funcionando como deseja, pode ignorar este bloco.
-- DROP POLICY IF EXISTS "receipts_select_temp" ON storage.objects;
-- CREATE POLICY "receipts_select_temp"
-- ON storage.objects
-- FOR SELECT
-- TO public
-- USING (
--   bucket_id = 'receipts'
--   AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
-- );

-- 4) Verificacao final
select policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;

-- ============================================
-- PROXIMO PASSO (versao realmente segura):
-- Migrar login para Supabase Auth e usar auth.uid() nas policies.
-- Sem JWT por usuario, nao ha como garantir isolamento forte por usuario no Storage.
-- ============================================
