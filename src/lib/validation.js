/**
 * Utilitários de validação e sanitização
 * Protege contra XSS, injection e dados inválidos
 */

/**
 * Sanitiza string removendo caracteres HTML perigosos
 * Protege contra XSS (Cross-Site Scripting)
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Valida username
 * - Apenas letras, números, espaços, pontos, underscores e hífens
 * - Sem caracteres especiais perigosos
 */
export function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Nome de usuário inválido' };
  }

  const trimmed = username.trim();
  
  if (trimmed.length < 2) {
    return { valid: false, error: 'Nome deve ter pelo menos 2 caracteres' };
  }

  if (trimmed.length > 50) {
    return { valid: false, error: 'Nome muito longo (máx. 50 caracteres)' };
  }

  // Permite letras (com acentos), números, espaços, ponto, underscore, hífen
  const validPattern = /^[a-zA-Z0-9áàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ\s._-]+$/;
  
  if (!validPattern.test(trimmed)) {
    return { valid: false, error: 'Nome contém caracteres inválidos' };
  }

  return { valid: true, sanitized: sanitizeString(trimmed) };
}

/**
 * Valida PIN
 * - Deve ter exatamente 4 dígitos numéricos
 */
export function validatePin(pin) {
  if (!pin || typeof pin !== 'string') {
    return { valid: false, error: 'PIN inválido' };
  }

  const trimmed = pin.trim();
  
  if (!/^[0-9]{4}$/.test(trimmed)) {
    return { valid: false, error: 'PIN deve ter exatamente 4 dígitos' };
  }

  return { valid: true, sanitized: trimmed };
}

/**
 * Valida valor monetário
 * - Deve ser número positivo
 */
export function validateAmount(amount) {
  if (amount === null || amount === undefined || amount === '') {
    return { valid: false, error: 'Valor inválido' };
  }

  // Converte string com vírgula para número
  let numValue = amount;
  if (typeof amount === 'string') {
    numValue = parseFloat(amount.replace(',', '.'));
  }

  if (isNaN(numValue) || numValue <= 0) {
    return { valid: false, error: 'Valor deve ser positivo' };
  }

  if (numValue > 999999.99) {
    return { valid: false, error: 'Valor muito alto' };
  }

  return { valid: true, sanitized: numValue };
}

/**
 * Valida descrição de transação
 * - Não pode estar vazia
 * - Remove caracteres perigosos
 */
export function validateDescription(description) {
  if (!description || typeof description !== 'string') {
    return { valid: false, error: 'Descrição inválida' };
  }

  const trimmed = description.trim();
  
  if (trimmed.length < 3) {
    return { valid: false, error: 'Descrição muito curta (mín. 3 caracteres)' };
  }

  if (trimmed.length > 500) {
    return { valid: false, error: 'Descrição muito longa (máx. 500 caracteres)' };
  }

  return { valid: true, sanitized: sanitizeString(trimmed) };
}

/**
 * Valida formato de mês/ano
 * Ex: "Janeiro/2026"
 */
export function validateMonthRef(monthRef) {
  if (!monthRef || typeof monthRef !== 'string') {
    return { valid: false, error: 'Mês inválido' };
  }

  const pattern = /^[A-Za-zçÇ]+\/\d{4}$/;
  
  if (!pattern.test(monthRef)) {
    return { valid: false, error: 'Formato de mês inválido' };
  }

  return { valid: true, sanitized: sanitizeString(monthRef) };
}

/**
 * Valida lista de meses selecionados
 */
export function validateSelectedMonths(months) {
  if (!Array.isArray(months) || months.length === 0) {
    return { valid: false, error: 'Selecione pelo menos um mês' };
  }

  if (months.length > 12) {
    return { valid: false, error: 'Máximo de 12 meses por vez' };
  }

  // Valida cada mês
  for (const month of months) {
    const validation = validateMonthRef(month);
    if (!validation.valid) {
      return validation;
    }
  }

  return { valid: true, sanitized: months.map(m => sanitizeString(m)) };
}

/**
 * Valida status de pagamento
 */
export function validatePaymentStatus(status) {
  const validStatuses = ['pending', 'approved', 'rejected'];
  
  if (!validStatuses.includes(status)) {
    return { valid: false, error: 'Status inválido' };
  }

  return { valid: true, sanitized: status };
}

/**
 * Valida tipo de transação
 */
export function validateTransactionType(tipo) {
  const validTypes = ['entrada', 'saida'];
  
  if (!validTypes.includes(tipo)) {
    return { valid: false, error: 'Tipo de transação inválido' };
  }

  return { valid: true, sanitized: tipo };
}

/**
 * Valida arquivo (comprovante)
 */
export function validateReceiptFile(file) {
  // Arquivo é opcional
  if (!file) {
    return { valid: true };
  }

  // Tipos permitidos
  const validTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'application/pdf'
  ];

  if (!validTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: 'Formato inválido. Use JPG, PNG ou PDF' 
    };
  }

  // Tamanho máximo: 5MB
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: 'Arquivo muito grande (máx. 5MB)' 
    };
  }

  return { valid: true };
}

/**
 * Escapa caracteres especiais de SQL (proteção extra)
 * Nota: O Supabase já faz isso automaticamente, mas não custa garantir
 */
export function escapeSql(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/'/g, "''");
}

/**
 * Remove espaços extras e normaliza string
 */
export function normalizeString(str) {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/\s+/g, ' ');
}

/**
 * Valida UUID
 */
export function validateUuid(uuid) {
  const pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return pattern.test(uuid);
}

/**
 * Decodifica entidades HTML
 * Reverte sanitização feita pelo sanitizeString
 */
export function decodeHtmlEntities(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}
