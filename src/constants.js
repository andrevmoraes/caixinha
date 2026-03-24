/**
 * Constantes da aplicação
 * Centralizar textos, configurações e valores reutilizáveis
 */

// ===== CONTACTO & CONFIGURAÇÕES =====
export const PIX_KEY = '19997132723';
export const WHATSAPP_NUMBER = '5511940041515';

// ===== TEXTOS DE LABELS =====
export const LABELS = {
  username: 'Nome de usuário',
  pin: 'PIN (sua senha de 4 dígitos)',
  pinConfirm: 'Confirme seu PIN',
  file: 'Anexar comprovante',
};

// ===== PLACEHOLDER TEXTS =====
export const PLACEHOLDERS = {
  username: 'Digite seu nome',
  pin: '0000',
};

// ===== HELPER TEXTS =====
export const HELPERS = {
  usernameLogin: 'O nome que você usou no cadastro',
  usernameRegister: 'Como você quer ser chamado (mínimo 3 caracteres)',
  pinLogin: 'Sua senha secreta de 4 números',
  pinRegister: 'Escolha 4 números que você não vai esquecer',
  pinConfirm: 'Digite novamente para confirmar',
};

// ===== STATUS =====
export const PAYMENT_STATUS = {
  pending: 'pendente',
  approved: 'aprovado',
  rejected: 'rejeitado',
};

export const STATUS_COLORS = {
  pending: { border: '#eab308', bg: '#fffbeb', badge: 'bg-yellow-500 text-black' },
  approved: { border: '#16a34a', bg: '#f0fdf4', badge: 'bg-green-600 text-white' },
  rejected: { border: '#dc2626', bg: '#fef2f2', badge: 'bg-red-600 text-white' },
};

// ===== TRANSAÇÃO TIPOS =====
export const TRANSACTION_TYPES = {
  entrada: 'entrada',
  saida: 'saída',
};

export const TRANSACTION_TYPE_COLORS = {
  entrada: '#16a34a',
  saida: '#dc2626',
};

// ===== MESES =====
export const MESES_2026 = [
  'Janeiro/2026',
  'Fevereiro/2026',
  'Março/2026',
  'Abril/2026',
  'Maio/2026',
  'Junho/2026',
  'Julho/2026',
  'Agosto/2026',
  'Setembro/2026',
  'Outubro/2026',
  'Novembro/2026',
  'Dezembro/2026',
];

// ===== MENSAGENS DE ERRO =====
export const ERROR_MESSAGES = {
  requiredUsername: 'Digite um nome de usuário.',
  invalidUsername: 'Nome deve ter pelo menos 3 caracteres.',
  missingPin: 'O PIN precisa ter exatamente 4 dígitos.',
  pinMismatch: 'Os PINs não coincidem. Digite novamente.',
  userExists: 'Nome de usuário já existe.',
  invalidFile: 'Nenhum arquivo selecionado.',
  selectMonths: 'Selecione pelo menos um mês.',
  noPermission: 'Você não tem permissão para acessar.',
  defaultError: 'Ocorreu um erro. Tente novamente.',
};

// ===== MENSAGENS DE SUCESSO =====
export const SUCCESS_MESSAGES = {
  receiptUploaded: 'Comprovante enviado! Aguarde aprovação.',
  profileUpdated: 'Perfil atualizado com sucesso!',
  transactionCreated: 'Transação registrada com sucesso!',
};

// ===== BUTTONS LABELS =====
export const BUTTON_LABELS = {
  login: 'Entrar',
  register: 'Criar Conta',
  update: 'Atualizar',
  save: 'Salvar alterações',
  logout: 'Sair da conta',
  submit: 'Enviar',
  upload: 'Registrar pagamento',
  tryAgain: 'Tentar novamente',
};

// ===== ARIA LABELS (Acessibilidade) =====
export const ARIA_LABELS = {
  togglePin: {
    show: 'Mostrar PIN',
    hide: 'Ocultar PIN',
  },
  togglePassword: {
    show: 'Mostrar senha',
    hide: 'Ocultar senha',
  },
  toggleFile: 'Selecionar arquivo',
  copyPix: 'Copiar chave PIX',
  whatsapp: 'Enviar via WhatsApp',
  refresh: 'Atualizar dados',
  expand: 'Expandir',
  collapse: 'Recolher',
};
