import { useEffect } from 'react';

export function useTheme() {
  // Tema escuro desativado - sempre usar tema claro
  const isDark = false;

  useEffect(() => {
    // Garantir que a classe 'dark' nunca seja adicionada
    const html = document.documentElement;
    html.classList.remove('dark');
  }, []);

  // Função toggleTheme desativada (mantida para compatibilidade)
  const toggleTheme = () => {
    console.log('Tema escuro desativado - tema claro sempre ativo');
  };

  return { isDark, toggleTheme };
}
