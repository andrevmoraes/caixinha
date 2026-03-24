// Configuração do Supabase via variáveis de ambiente
// Não adicione este arquivo ao git se contiver credenciais reais!
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ [CONFIG] Credenciais do Supabase não encontradas em .env');
}
