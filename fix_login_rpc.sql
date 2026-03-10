-- ============================================
-- FIX LOGIN: autenticacao via RPC (sem depender de RLS de SELECT)
-- ============================================
-- Execute no Supabase SQL Editor

create or replace function public.authenticate_user(p_username text, p_pin text)
returns table (
  id uuid,
  username text,
  pin text,
  is_admin boolean,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select p.id, p.username, p.pin, p.is_admin, p.created_at
  from public.profiles p
  where p.username = p_username
    and p.pin = p_pin
  limit 1;
$$;

-- Permite chamada da RPC para clientes anon/authenticated
grant execute on function public.authenticate_user(text, text) to anon, authenticated;

-- Verificacao rapida
select routine_name, routine_schema
from information_schema.routines
where routine_schema = 'public' and routine_name = 'authenticate_user';
