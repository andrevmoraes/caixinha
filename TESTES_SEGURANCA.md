# 🧪 GUIA DE TESTES DE SEGURANÇA

## 📋 CHECKLIST DE TESTES

Execute estes testes para garantir que a segurança está funcionando corretamente.

---

## ⚠️ ANTES DE COMEÇAR

1. ✅ Aplicou o script `supabase_security_policies.sql` no Supabase
2. ✅ Configurou as políticas do Storage (bucket receipts)
3. ✅ Fez deploy do código atualizado

---

## 🔒 TESTE 1: RLS - Isolamento de Dados de Usuários

### Objetivo
Garantir que usuários NÃO podem acessar dados de outros usuários.

### Passos

1. **Criar dois usuários de teste**:
   - Usuário A: `teste_user_a` (PIN: 1111)
   - Usuário B: `teste_user_b` (PIN: 2222)

2. **Login como Usuário A**:
   - Faça login com `teste_user_a`
   - Abra o **Console do navegador** (F12)
   - Execute:
     ```javascript
     const { data, error } = await supabase.from('profiles').select('*');
     console.log(data);
     ```
   - **RESULTADO ESPERADO**: ❌ Deve retornar apenas o perfil do Usuário A, não todos os perfis

3. **Tentar modificar outro usuário**:
   - No console, execute:
     ```javascript
     const { data, error } = await supabase
       .from('profiles')
       .update({ username: 'HACKEADO' })
       .eq('username', 'teste_user_b');
     console.log(error);
     ```
   - **RESULTADO ESPERADO**: ❌ Deve retornar erro de permissão

4. **Tentar se promover a admin**:
   - No console, execute:
     ```javascript
     const { data, error } = await supabase
       .from('profiles')
       .update({ is_admin: true })
       .eq('username', 'teste_user_a');
     console.log(error);
     ```
   - **RESULTADO ESPERADO**: ❌ Deve retornar erro de permissão

### ✅ Status
- [ ] Usuário A só vê seus próprios dados
- [ ] Usuário A não pode modificar dados de outros
- [ ] Usuário A não pode se promover a admin

---

## 👤 TESTE 2: RLS - Isolamento de Pagamentos

### Objetivo
Garantir que usuários só veem seus próprios pagamentos.

### Passos

1. **Criar pagamentos de teste**:
   - Login como `teste_user_a`
   - Faça upload de um comprovante para Janeiro/2026
   - Logout
   - Login como `teste_user_b`
   - Faça upload de um comprovante para Fevereiro/2026

2. **Verificar isolamento**:
   - Ainda logado como `teste_user_b`
   - Abra o console (F12)
   - Execute:
     ```javascript
     const { data, error } = await supabase
       .from('payments')
       .select('*, profiles(username)');
     console.log(data);
     ```
   - **RESULTADO ESPERADO**: ❌ Deve retornar apenas pagamentos do `teste_user_b`

3. **Tentar aprovar o próprio pagamento**:
   - No console, execute:
     ```javascript
     const { data, error } = await supabase
       .from('payments')
       .update({ status: 'approved' })
       .eq('user_id', 'SEU_USER_ID');
     console.log(error);
     ```
   - **RESULTADO ESPERADO**: ❌ Deve retornar erro (só admin pode aprovar)

### ✅ Status
- [ ] Usuário B só vê seus próprios pagamentos
- [ ] Usuário B não pode aprovar o próprio pagamento

---

## 👑 TESTE 3: Permissões de Admin

### Objetivo
Garantir que admins têm acesso a todos os dados.

### Passos

1. **Criar usuário admin** (via SQL Editor no Supabase):
   ```sql
   UPDATE profiles 
   SET is_admin = true 
   WHERE username = 'seu_usuario_admin';
   ```

2. **Login como admin**:
   - Faça login com o usuário admin
   - Vá para o painel admin (`/admin`)

3. **Verificar acesso a todos os dados**:
   - Abra o console (F12)
   - Execute:
     ```javascript
     const { data, error } = await supabase
       .from('profiles')
       .select('*');
     console.log(data);
     ```
   - **RESULTADO ESPERADO**: ✅ Deve retornar TODOS os perfis

4. **Verificar acesso a todos os pagamentos**:
   - No console, execute:
     ```javascript
     const { data, error } = await supabase
       .from('payments')
       .select('*, profiles(username)');
     console.log(data);
     ```
   - **RESULTADO ESPERADO**: ✅ Deve retornar TODOS os pagamentos

5. **Aprovar um pagamento**:
   - No painel admin, clique em **Aprovar** em um pagamento pendente
   - **RESULTADO ESPERADO**: ✅ Pagamento deve ser aprovado com sucesso

6. **Criar transação**:
   - No painel admin, clique em **Adicionar Dinheiro**
   - Preencha valor e descrição
   - Clique em **Confirmar**
   - **RESULTADO ESPERADO**: ✅ Transação criada com sucesso

### ✅ Status
- [ ] Admin vê todos os perfis
- [ ] Admin vê todos os pagamentos
- [ ] Admin pode aprovar/rejeitar pagamentos
- [ ] Admin pode criar transações

---

## 📁 TESTE 4: Segurança do Storage (Comprovantes)

### Objetivo
Garantir que comprovantes estão protegidos.

### Passos

1. **Upload de comprovante**:
   - Login como `teste_user_a`
   - Faça upload de um comprovante
   - Copie a URL do comprovante (disponível no painel)

2. **Tentar acessar comprovante sem login**:
   - Abra uma **janela anônima** do navegador
   - Cole a URL do comprovante
   - **RESULTADO ESPERADO**: ❌ Deve retornar erro "Access denied" ou 403

3. **Tentar acessar comprovante de outro usuário**:
   - Login como `teste_user_b`
   - Cole a URL do comprovante do `teste_user_a`
   - **RESULTADO ESPERADO**: ❌ Deve retornar erro "Access denied"

4. **Admin visualizar comprovantes**:
   - Login como admin
   - Vá para o painel admin
   - Clique em "Ver" no comprovante de qualquer usuário
   - **RESULTADO ESPERADO**: ✅ Comprovante deve abrir normalmente

### ✅ Status
- [ ] Comprovantes não acessíveis sem login
- [ ] Usuários não veem comprovantes de outros
- [ ] Admin vê todos os comprovantes

---

## 🛡️ TESTE 5: Validação de Inputs

### Objetivo
Garantir que validação está funcionando.

### Passos

1. **Cadastro com username inválido**:
   - Tente cadastrar com username: `<script>alert('xss')</script>`
   - **RESULTADO ESPERADO**: ❌ Deve mostrar erro "caracteres inválidos"

2. **Cadastro com PIN inválido**:
   - Tente cadastrar com PIN: `abc4`
   - **RESULTADO ESPERADO**: ❌ Deve mostrar erro "PIN deve ter 4 dígitos"

3. **Cadastro com PIN curto**:
   - Tente cadastrar com PIN: `123`
   - **RESULTADO ESPERADO**: ❌ Deve mostrar erro

4. **Upload de arquivo muito grande**:
   - Tente fazer upload de arquivo > 5MB
   - **RESULTADO ESPERADO**: ❌ Deve mostrar erro "Arquivo muito grande"

5. **Upload de arquivo inválido**:
   - Tente fazer upload de arquivo .exe ou .zip
   - **RESULTADO ESPERADO**: ❌ Deve mostrar erro "Formato inválido"

6. **Transação com valor negativo** (como admin):
   - No painel admin, tente criar transação com valor `-50`
   - **RESULTADO ESPERADO**: ❌ Deve mostrar erro

7. **Transação sem descrição** (como admin):
   - Tente criar transação deixando descrição vazia
   - **RESULTADO ESPERADO**: ❌ Deve mostrar erro

### ✅ Status
- [ ] Username valida caracteres especiais
- [ ] PIN valida formato numérico
- [ ] Upload valida tipo de arquivo
- [ ] Upload valida tamanho de arquivo
- [ ] Transação valida valor positivo
- [ ] Transação valida descrição obrigatória

---

## 🔐 TESTE 6: HTTPS e Headers de Segurança

### Objetivo
Garantir que HTTPS está ativo e headers de segurança estão configurados.

### Passos

1. **Verificar HTTPS**:
   - Acesse o app no Vercel
   - Verifique se a URL começa com `https://`
   - Tente acessar via `http://` (deve redirecionar para `https://`)
   - **RESULTADO ESPERADO**: ✅ Sempre HTTPS

2. **Verificar headers de segurança**:
   - Abra o console (F12)
   - Vá para a aba **Network**
   - Recarregue a página
   - Clique na primeira requisição
   - Vá para **Headers** > **Response Headers**
   - Verifique se existem:
     - `strict-transport-security`
     - `x-content-type-options: nosniff`
     - `x-frame-options: DENY`
     - `x-xss-protection`
   - **RESULTADO ESPERADO**: ✅ Todos os headers presentes

### ✅ Status
- [ ] HTTPS ativo e obrigatório
- [ ] Headers de segurança configurados

---

## 🐛 TESTE 7: Tentativas de SQL Injection

### Objetivo
Garantir que o app está protegido contra SQL Injection.

### Passos

1. **Login com SQL injection**:
   - Na tela de login, tente:
     - Username: `admin' OR '1'='1`
     - PIN: `1111`
   - **RESULTADO ESPERADO**: ❌ Deve falhar (username inválido)

2. **Cadastro com SQL injection**:
   - Na tela de cadastro, tente:
     - Username: `'; DROP TABLE profiles; --`
     - PIN: `1234`
   - **RESULTADO ESPERADO**: ❌ Deve falhar (caracteres inválidos)

### ✅ Status
- [ ] SQL injection no login bloqueado
- [ ] SQL injection no cadastro bloqueado

---

## 📊 RESUMO DOS TESTES

| Teste | Status | Observações |
|-------|--------|-------------|
| 1. Isolamento de usuários | ⬜ | |
| 2. Isolamento de pagamentos | ⬜ | |
| 3. Permissões de admin | ⬜ | |
| 4. Segurança do Storage | ⬜ | |
| 5. Validação de inputs | ⬜ | |
| 6. HTTPS e headers | ⬜ | |
| 7. SQL Injection | ⬜ | |

---

## ❌ SE ALGUM TESTE FALHAR

### Teste 1, 2, 3 falharam:
- Verifique se o script SQL foi aplicado corretamente
- Verifique se `set_current_user_id` está sendo chamado após login
- Verifique os logs do Supabase (Dashboard > Logs)

### Teste 4 falhou:
- Verifique se as políticas do Storage foram criadas
- Verifique se RLS está ativado no bucket

### Teste 5 falhou:
- Verifique se os imports de `validation.js` estão corretos
- Verifique se o código foi atualizado e deployado

### Teste 6 falhou:
- Faça novo deploy no Vercel
- Aguarde alguns minutos para propagação

### Teste 7 falhou:
- Verifique o código de validação
- Adicione mais filtros se necessário

---

## ✅ TODOS OS TESTES PASSARAM?

Parabéns! Seu app está seguro. 🎉

### Próximos passos:
1. Documente os resultados dos testes
2. Configure monitoramento de logs no Supabase
3. Configure alertas para tentativas de acesso não autorizado
4. Implemente logs de auditoria para ações de admin
5. Considere adicionar rate limiting para login

---

## 📝 NOTAS

- Execute estes testes regularmente (a cada atualização)
- Mantenha um log dos resultados
- Se adicionar novas features, crie novos testes
- Revise as políticas de segurança periodicamente
