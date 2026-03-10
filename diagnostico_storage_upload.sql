-- ============================================
-- DIAGNOSTICO STORAGE RLS (bucket receipts)
-- ============================================
-- Execute no Supabase SQL Editor

-- 1) Bucket existe e está privado?
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'receipts';

-- 2) Politicas ativas no storage.objects
select schemaname, tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
order by policyname;

-- 3) Políticas especificamente ligadas ao bucket receipts
select policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and (
    coalesce(qual, '') ilike '%receipts%'
    or coalesce(with_check, '') ilike '%receipts%'
  )
order by policyname;

-- 4) Objetos existentes no bucket (sanidade)
select id, bucket_id, name, owner, created_at
from storage.objects
where bucket_id = 'receipts'
order by created_at desc
limit 20;

-- 5) Verifica funcoes auxiliares de contexto RLS
select routine_name, data_type as return_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name in ('set_current_user_id', 'get_current_rls_config');

-- 6) Teste basico de configuracao de contexto (troque pelo user_id real)
-- select * from set_current_user_id('SEU-UUID-AQUI'::uuid);
-- select * from get_current_rls_config();

-- ============================================
-- Referencia de policy INSERT esperada para receipts:
-- WITH CHECK (
--   bucket_id = 'receipts'
--   and (storage.foldername(name))[1] = current_setting('app.current_user_id', true)
-- )
-- ============================================
