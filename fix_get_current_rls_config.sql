-- Cria funcao de diagnostico usada pelos logs do frontend
create or replace function public.get_current_rls_config()
returns table(user_id text, is_admin text)
language sql
security definer
as $$
  select
    current_setting('app.current_user_id', true) as user_id,
    current_setting('app.is_admin', true) as is_admin;
$$;
