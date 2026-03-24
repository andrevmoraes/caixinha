import ChevronIcon from './ChevronIcon';
import { TRANSACTION_TYPES } from '../constants';

export default function TransactionCard({
  tipo,
  valor,
  descricao,
  data,
  adminNome,
  isExpanded,
  onToggle
}) {
  const isEntrada = tipo === 'entrada';
  const borderColor = isEntrada ? '#16a34a' : '#dc2626';
  const displayType = TRANSACTION_TYPES[tipo] || tipo;
  
  const getCardBackground = () => {
    if (document.documentElement.classList.contains('dark')) {
      return '#1a1a1a';
    }
    return isEntrada ? '#f0fdf4' : '#fef2f2';
  };

  const statusColor = isEntrada ? 'text-green-700' : 'text-red-700';
  const statusBadgeColor = isEntrada ? 'bg-green-600 text-white' : 'bg-red-600 text-white';

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  // Versão colapsada
  if (!isExpanded && onToggle) {
    return (
      <button
        onClick={onToggle}
        className="w-full text-left border-l-4 px-4 py-3 flex items-center justify-between gap-3 hover:shadow-md transition cursor-pointer active:scale-98"
        style={{
          borderLeftColor: borderColor,
          backgroundColor: getCardBackground()
        }}
        aria-label={`${displayType}: ${descricao}`}
      >
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-sm text-[var(--color-marinho-itau)] truncate block">{descricao}</span>
          <span className={`text-xs font-semibold ${statusColor}`}>R$ {valor.toFixed(2).replace('.', ',')}</span>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 whitespace-nowrap text-center w-20 ${statusBadgeColor}`}>
          {displayType}
        </span>
        <span className="text-gray-600 flex-shrink-0"><ChevronIcon isExpanded={false} /></span>
      </button>
    );
  }

  // Versão expandida
  return (
    <div
      className="border-l-4 p-6 flex flex-col gap-4"
      style={{
        borderLeftColor: borderColor,
        backgroundColor: getCardBackground()
      }}
    >
      {onToggle && (
        <button
          onClick={onToggle}
          className="self-end text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1"
          aria-label="Recolher"
        >
          <ChevronIcon isExpanded={true} />
          recolher
        </button>
      )}

      {/* Cabeçalho do Card */}
      <div className="flex flex-col gap-2">
        <div className="text-3xl font-bold text-[var(--color-marinho-itau)]">R$ {valor.toFixed(2).replace('.', ',')}</div>
        <span className={`inline-block text-sm font-semibold px-3 py-1 w-24 text-center ${statusBadgeColor}`}>
          {displayType}
        </span>
      </div>

      {/* Separador */}
      <div className="h-px bg-gray-300 opacity-30 dark:bg-gray-600"></div>

      {/* Informações */}
      <div className="flex flex-col gap-3">
        <div>
          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">DESCRIÇÃO</div>
          <div className="text-sm text-gray-700 dark:text-gray-300">{descricao}</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs font-semibold text-gray-600 mb-1">DATA</div>
            <div className="text-sm text-gray-700">{formatDate(data)}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-600 mb-1">ADMIN</div>
            <div className="text-sm text-gray-700">{adminNome || 'Sistema'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
