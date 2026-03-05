# 🔒 GUIA DE IMPLEMENTAÇÃO DE SEGURANÇA

## ⚠️ VULNERABILIDADES CRÍTICAS IDENTIFICADAS

Este documento lista as vulnerabilidades encontradas no app e como corrigi-las.

---

## 🚨 PRIORIDADE CRÍTICA

### 1. Row Level Security (RLS) NÃO está ativado

**RISCO**: Qualquer usuário pode acessar/modificar dados de outros usuários.

**COMO CORRIGIR**: Aplique o script `supabase_security_policies.sql` no painel do Supabase.

---

### 2. PINs armazenados em texto plano

**RISCO**: Se alguém acessar o banco, vê todos os PINs.

**SOLUÇÃO ATUAL**: Por enquanto, o RLS já impede acesso não autorizado.
**SOLUÇÃO IDEAL**: Implementar hash de senha (bcrypt) - requer Edge Functions no Supabase.

---

### 3. Validação apenas no frontend

**RISCO**: Desenvolvedores podem burlar validações via console do navegador.

**SOLUÇÃO**: 
- Scripts SQL incluem constraints no banco de dados
- Utilitários de validação adicionados no código
- Sanitização de inputs para prevenir XSS

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### PASSO 1: Aplicar RLS no Supabase (URGENTE!)

1. Acesse: https://supabase.com/dashboard/project/trndsazwuijnxsxfhakb
2. Vá em **SQL Editor**
3. Copie e execute o conteúdo do arquivo `supabase_security_policies.sql`
4. Confirme que as policies foram criadas com sucesso

**TEMPO ESTIMADO**: 5 minutos

---

### PASSO 2: Atualizar código do frontend

Os seguintes arquivos foram atualizados com validação e sanitização:
- `src/lib/validation.js` (NOVO - utilitários de validação)
- `src/components/Register.jsx` (atualizado)
- `src/components/Login.jsx` (atualizado)
- `src/components/AdminPanel.jsx` (atualizado)
- `src/components/UserDashboard.jsx` (atualizado)

**AÇÃO**: Revise as alterações e teste o app.

---

### PASSO 3: Configurar HTTPS obrigatório

O arquivo `vercel.json` foi atualizado para forçar HTTPS.

**AÇÃO**: Fazer deploy no Vercel para aplicar.

---

### PASSO 4: Testar as políticas de segurança

Após aplicar o RLS:

1. **Teste como usuário comum**:
   - Tente acessar dados de outro usuário pelo console:
     ```javascript
     await supabase.from('profiles').select('*')
     ```
   - ❌ Deve retornar erro ou apenas seu próprio registro

2. **Teste como admin**:
   - Faça login como admin
   - Tente ver todos os pagamentos:
     ```javascript
     await supabase.from('payments').select('*, profiles(*)')
     ```
   - ✅ Deve funcionar normalmente

3. **Teste modificação não autorizada**:
   - Como usuário comum, tente se tornar admin:
     ```javascript
     await supabase.from('profiles').update({ is_admin: true }).eq('id', 'seu_id')
     ```
   - ❌ Deve retornar erro de permissão

---

## 🔍 MONITORAMENTO CONTÍNUO

### Logs no Supabase

Configure alertas para:
- Tentativas de acesso negadas (RLS blocks)
- Múltiplas tentativas de login falhadas
- Alterações em registros de admin

### Atualizações de dependências

Execute regularmente:
```bash
npm audit
npm audit fix
```

---

## 📞 SUPORTE

Se encontrar problemas ao implementar:
1. Verifique os logs do Supabase (Dashboard > Logs)
2. Confirme que o RLS está ativado (Dashboard > Database > Tables > selecione tabela > verifique "Enable RLS")
3. Teste as queries no SQL Editor antes de aplicar no app

---

## 🎯 PRÓXIMOS PASSOS (após implementar o básico)

- [ ] Implementar rate limiting (limite de tentativas de login)
- [ ] Adicionar logs de auditoria
- [ ] Implementar 2FA (autenticação de dois fatores)
- [ ] Migrar para Supabase Auth (autenticação nativa) em vez de PIN customizado
- [ ] Implementar hash de senha via Edge Functions
