# 🔧 Solução: Admin não vê pagamentos (retorna 0)

## ✅ Diagnóstico Realizado

**Resultado do diagnóstico:**
- ✅ 48 pagamentos existem no banco
- ✅ Usuário "André" é admin (`is_admin = true`)
- ✅ Políticas RLS corretas
- ✅ Com RLS simulado retorna 48 pagamentos

**Conclusão:** O problema NÃO é com as políticas ou status de admin. O problema é que a função `set_current_user_id` não está configurando `app.is_admin` corretamente em todas as conexões do pool do Supabase.

## 🔧 Solução Aplicada

O código foi atualizado para **reconfigurar o RLS imediatamente antes de cada query**. Isso garante que `app.is_admin` esteja configurado na conexão atual do pool.

### Mudança no código
```javascript
// ANTES de fazer as queries, reconfigura RLS
await supabase.rpc('set_current_user_id', { user_id: user.id });

// AGORA faz as queries com RLS configurado
const pagamentos = await supabase.from('payments').select('*');
```

## 🧪 Como testar

1. **Faça deploy no Vercel**
2. **Acesse como admin**
3. **Observe o console:**
   ```
   🔧 [ADMIN-xxx] Reconfigurando RLS antes das queries...
   📡 [ADMIN-xxx] Iniciando query de pagamentos...
   ✅ [ADMIN-xxx] Pagamentos carregados: 48
   ```

4. **Resultado esperado:**
   - ✅ Apenas UMA execução por refresh
   - ✅ 48 pagamentos carregados
   - ✅ 3 transações carregadas

## ⚠️ Se ainda não funcionar

### Opção A: Verificar se a função está sendo executada
```sql
-- No Supabase, teste manualmente:
SELECT set_current_user_id('c9ce073a-ff27-4e8f-ab03-949160beaac6'::uuid);
SELECT current_setting('app.is_admin', true);
```

### Opção B: Alternativa - Query sem RLS (temporário para teste)
Se precisar de uma solução temporária enquanto debugamos:

```sql
-- TEMPORÁRIO: Desabilita RLS para admins testarem
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- ⚠️ IMPORTANTE: Não deixe assim em produção!
-- É apenas para confirmar que o problema é RLS
```

### Opção C: Modificar a função set_current_user_id
Tornar a configuração mais persistente:

```sql
CREATE OR REPLACE FUNCTION set_current_user_id(user_id uuid)
RETURNS void AS $$
DECLARE
  user_is_admin boolean;
BEGIN
  -- Configura para a SESSÃO inteira (não só transação)
  PERFORM set_config('app.current_user_id', user_id::text, false);
  
  SELECT is_admin INTO user_is_admin FROM profiles WHERE id = user_id;
  
  -- Força configuração do is_admin
  IF user_is_admin IS NULL THEN
    user_is_admin := false;
  END IF;
  
  PERFORM set_config('app.is_admin', user_is_admin::text, false);
  
  -- Log para debug (remover depois)
  RAISE NOTICE 'RLS configurado: user_id=%, is_admin=%', user_id, user_is_admin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 📊 Logs Esperados (Sucesso)

```
🔧 [ADMIN] Iniciando configuração - user.id: c9ce073a-... is_admin: true
✅ [ADMIN] RLS configurado com sucesso
⏳ [ADMIN] Aguardando 200ms para garantir aplicação do RLS...
✅ [ADMIN] Delay concluído, iniciando busca de dados...
🔍 [ADMIN-1234567890] Buscando dados...
🔧 [ADMIN-1234567890] Reconfigurando RLS antes das queries...
📡 [ADMIN-1234567890] Iniciando query de pagamentos...
📡 [ADMIN-1234567890] Iniciando query de transações...
📊 [ADMIN-1234567890] Resultado pagamentos - status: 200
📊 [ADMIN-1234567890] Pagamentos - data: 48  ✅
✅ [ADMIN-1234567890] Pagamentos carregados: 48
✅ [ADMIN-1234567890] Transações carregadas: 3
💾 [ADMIN-1234567890] Salvando no estado - pagamentos: 48 transações: 3
```
