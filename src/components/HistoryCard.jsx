import ChevronIcon from './ChevronIcon';
import { STATUS_COLORS } from '../constants';

export default function HistoryCard({ meses, valor, status, receiptLink, isExpanded, onToggle }) {
  // Map backend status to display status
  const statusDisplay = {
    pending: 'Pendente',
    approved: 'Aprovado', 
    rejected: 'Rejeitado'
  }[status] || status;
  
  const statusColors = {
    'Pendente': '#eab308',
    'Aprovado': '#16a34a',
    'Rejeitado': '#dc2626'
  };

  const statusBadgeColors = {
    'Pendente': 'bg-yellow-500 text-black',
    'Aprovado': 'bg-green-600 text-white',
    'Rejeitado': 'bg-red-600 text-white'
  };

  const getCardBackground = () => {
    if (document.documentElement.classList.contains('dark')) {
      return '#1a1a1a';
    }
    return {
      'Pendente': '#fffbeb',
      'Aprovado': '#f0fdf4',
      'Rejeitado': '#fef2f2'
    }[statusDisplay] || '#f0fdf4';
  };

  const borderColor = statusColors[statusDisplay] || '#16a34a';
  const statusBadgeClass = statusBadgeColors[statusDisplay] || 'bg-green-600 text-white';

  // Estado colapsado
  if (!isExpanded) {
    return (
      <button
        onClick={onToggle}
        className="w-full text-left border-l-4 px-4 py-2 flex items-center justify-between gap-3 hover:opacity-80 transition"
        style={{
          borderLeftColor: borderColor,
          backgroundColor: getCardBackground()
        }}
        aria-label={`Solicitação de R$ ${valor}`}
      >
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-sm text-[var(--color-marinho-itau)] truncate block">R$ {valor}</span>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 whitespace-nowrap ${statusBadgeClass}`}>
          {statusDisplay}
        </span>
        <span className="text-gray-400 flex-shrink-0"><ChevronIcon isExpanded={false} /></span>
      </button>
    );
  }

  // Estado expandido
  return (
    <div
      className="border-l-4 p-6 flex flex-col gap-4"
      style={{
        borderLeftColor: borderColor,
        backgroundColor: getCardBackground()
      }}
    >
      <button
        onClick={onToggle}
        className="self-end text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 flex items-center gap-1"
        aria-label="Recolher"
      >
        <ChevronIcon isExpanded={true} />
        recolher
      </button>

      {/* Cabeçalho do Card */}
      <div className="flex flex-col gap-2">
        <div className="text-3xl font-bold text-[var(--color-marinho-itau)]">R$ {valor}</div>
        <span className={`inline-block text-sm font-semibold px-3 py-1 w-fit ${statusBadgeClass}`}>
          {statusDisplay}
        </span>
      </div>

      {/* Separador */}
      <div className="h-px bg-gray-300 opacity-30 dark:bg-gray-600"></div>

      {/* Informações */}
      <div className="flex flex-col gap-3">
        <div>
          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">PERÍODOS ({meses.split(', ').length})</div>
          <div className="flex flex-wrap gap-2">
            {meses.split(', ').map((mes, idx) => (
              <span key={idx} className="inline-block bg-white bg-opacity-60 dark:bg-white dark:bg-opacity-10 text-gray-700 dark:text-gray-300 text-sm px-3 py-1">
                {mes}
              </span>
            ))}
          </div>
        </div>

        {/* Seção de comprovante desativada - funcionalidade mantida no backend */}
        {/* 
        {receiptLink && (
          <div>
            <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">COMPROVANTE</div>
            <a href={receiptLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 1V10M8 10L4 6M8 10L12 6M3 15H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              ver comprovante
            </a>
          </div>
        )}
        */}
      </div>
    </div>
  );
}
