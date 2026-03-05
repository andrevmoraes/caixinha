# 🔐 CONFIGURAÇÃO DO SUPABASE STORAGE (Bucket receipts)

## ⚠️ IMPORTANTE

O bucket `receipts` também precisa de políticas de segurança (RLS) para garantir que:
- Usuários só possam acessar seus próprios comprovantes
- Admins possam acessar todos os comprovantes
- Ninguém possa deletar comprovantes sem autorização

---

## 📋 PASSO A PASSO

### 1. Acessar configurações do bucket

1. Acesse: https://supabase.com/dashboard/project/trndsazwuijnxsxfhakb
2. No menu lateral, clique em **Storage**
3. Selecione o bucket **receipts**
4. Clique na aba **Policies**

---

### 2. Habilitar RLS no bucket

Se o bucket não existir, crie primeiro:
1. Clique em **"New bucket"**
2. Nome: `receipts`
3. **Public bucket**: DESMARQUE (deixe privado)
4. Clique em **Create bucket**

Depois, habilite RLS:
1. No bucket `receipts`, vá em **Policies**
2. Clique em **"Enable RLS"** (se não estiver ativado)

---

### 3. Criar política de SELECT (visualizar comprovantes)

**Política 1: Usuários podem ver apenas seus próprios comprovantes**

Clique em **"New Policy"** > **"For full customization"**

- **Policy name**: `Users can view own receipts`
- **Allowed operation**: `SELECT`
- **Target roles**: `public`
- **Policy definition (USING expression)**:
  ```sql
  (bucket_id = 'receipts'::text) 
  AND ((storage.foldername(name))[1] = (current_setting('app.current_user_id'::text))::text)
  ```

Clique em **Save policy**.

---

**Política 2: Admins podem ver todos os comprovantes**

Clique em **"New Policy"** > **"For full customization"**

- **Policy name**: `Admins can view all receipts`
- **Allowed operation**: `SELECT`
- **Target roles**: `public`
- **Policy definition (USING expression)**:
  ```sql
  (bucket_id = 'receipts'::text) 
  AND (EXISTS ( SELECT 1
     FROM profiles
    WHERE ((profiles.id = (current_setting('app.current_user_id'::text))::uuid) 
    AND (profiles.is_admin = true))))
  ```

Clique em **Save policy**.

---

### 4. Criar política de INSERT (fazer upload de comprovantes)

**Política 3: Usuários podem fazer upload apenas na própria pasta**

Clique em **"New Policy"** > **"For full customization"**

- **Policy name**: `Users can upload own receipts`
- **Allowed operation**: `INSERT`
- **Target roles**: `public`
- **Policy definition (WITH CHECK expression)**:
  ```sql
  (bucket_id = 'receipts'::text) 
  AND ((storage.foldername(name))[1] = (current_setting('app.current_user_id'::text))::text)
  ```

Clique em **Save policy**.

---

### 5. Criar política de UPDATE (atualizar comprovantes)

**Política 4: Usuários podem atualizar apenas seus próprios comprovantes**

Clique em **"New Policy"** > **"For full customization"**

- **Policy name**: `Users can update own receipts`
- **Allowed operation**: `UPDATE`
- **Target roles**: `public`
- **Policy definition (USING expression)**:
  ```sql
  (bucket_id = 'receipts'::text) 
  AND ((storage.foldername(name))[1] = (current_setting('app.current_user_id'::text))::text)
  ```

Clique em **Save policy**.

---

### 6. Criar política de DELETE (deletar comprovantes)

**Política 5: Apenas admins podem deletar comprovantes**

Clique em **"New Policy"** > **"For full customization"**

- **Policy name**: `Only admins can delete receipts`
- **Allowed operation**: `DELETE`
- **Target roles**: `public`
- **Policy definition (USING expression)**:
  ```sql
  (bucket_id = 'receipts'::text) 
  AND (EXISTS ( SELECT 1
     FROM profiles
    WHERE ((profiles.id = (current_setting('app.current_user_id'::text))::uuid) 
    AND (profiles.is_admin = true))))
  ```

Clique em **Save policy**.

---

## ✅ VERIFICAÇÃO

Após criar todas as políticas, você deve ter **5 políticas** no bucket `receipts`:

1. ✅ Users can view own receipts (SELECT)
2. ✅ Admins can view all receipts (SELECT)
3. ✅ Users can upload own receipts (INSERT)
4. ✅ Users can update own receipts (UPDATE)
5. ✅ Only admins can delete receipts (DELETE)

---

## 🧪 TESTAR AS POLÍTICAS

### Teste 1: Upload de comprovante
1. Faça login como usuário comum
2. Tente fazer upload de um comprovante
3. ✅ Deve funcionar normalmente

### Teste 2: Visualizar comprovante de outro usuário
1. Faça login como usuário comum
2. Copie a URL de um comprovante de outro usuário
3. Cole no navegador
4. ❌ Deve retornar erro "Access denied"

### Teste 3: Admin visualizar todos os comprovantes
1. Faça login como admin
2. Navegue até o painel admin
3. ✅ Deve conseguir ver os comprovantes de todos os usuários

### Teste 4: Deletar comprovante como usuário comum
1. Faça login como usuário comum
2. Tente deletar um comprovante via console:
   ```javascript
   await supabase.storage.from('receipts').remove(['SUA_PASTA/arquivo.jpg'])
   ```
3. ❌ Deve retornar erro de permissão

---

## 🔧 TROUBLESHOOTING

### Erro: "new row violates row-level security policy"
- Verifique se `set_current_user_id` está sendo chamado após login
- Verifique se o user_id está correto

### Erro: "Access denied" ao visualizar comprovante
- Verifique se as políticas de SELECT estão corretas
- Verifique se o comprovante está na pasta correta (user_id/arquivo.ext)

### Upload falha silenciosamente
- Verifique se a política de INSERT está ativa
- Verifique o console do navegador para erros

---

## 📝 NOTAS IMPORTANTES

1. **Estrutura de pastas**: Os comprovantes devem estar em:
   ```
   receipts/
     └── {user_id}/
           └── arquivo.jpg
   ```

2. **Permissões**: As políticas usam `current_setting('app.current_user_id')` configurado pelo RPC `set_current_user_id`.

3. **Segurança**: Com essas políticas, mesmo que alguém tenha a URL direta de um comprovante, não conseguirá acessá-lo sem permissão.

---

## 🚀 PRÓXIMOS PASSOS

Após configurar o Storage:
1. Testar upload e visualização de comprovantes
2. Testar como admin e como usuário comum
3. Verificar se os comprovantes ficam protegidos
4. Considerar implementar limpeza de comprovantes antigos
