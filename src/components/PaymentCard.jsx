import ChevronIcon from './ChevronIcon';

export default function PaymentCard({
  usuario,
  valor,
  status,
  meses,
  receiptLink,
  paymentIds,
  isExpanded,
  onToggle,
  onApprove,
  onReject
}) {
  const isCollapsible = status !== 'pendente';

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'aprovado':
        return 'bg-green-600 text-white';
      case 'pendente':
        return 'bg-yellow-500 text-black';
      case 'rejeitado':
        return 'bg-red-600 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getCardBackground = (status) => {
    if (document.documentElement.classList.contains('dark')) {
      return '#1a1a1a';
    }
    return status === 'aprovado' ? '#f0fdf4' : status === 'pendente' ? '#fffbeb' : '#fef2f2';
  };

  if (isCollapsible && !isExpanded) {
    return (
      <button
        onClick={onToggle}
        className="w-full text-left border-l-4 px-4 py-2 flex items-center justify-between gap-3 hover:opacity-80 transition overflow-x-hidden"
        style={{
          borderLeftColor: status === 'aprovado' ? '#16a34a' : status === 'pendente' ? '#eab308' : '#dc2626',
          backgroundColor: status === 'aprovado' ? '#f0fdf4' : status === 'pendente' ? '#fffbeb' : '#fef2f2'
        }}
      >
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-sm text-[var(--color-marinho-itau)] truncate block">{usuario}</span>
          <span className="text-xs text-gray-500">R$ {valor}</span>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 whitespace-nowrap ${getStatusBadgeColor(status)}`}>
          {status}
        </span>
        <span className="text-gray-400 flex-shrink-0"><ChevronIcon isExpanded={false} /></span>
      </button>
    );
  }

  return (
    <div
      className="border-l-4 p-6 flex flex-col gap-4 overflow-x-hidden"
      style={{
        borderLeftColor: status === 'aprovado' ? '#16a34a' : status === 'pendente' ? '#eab308' : '#dc2626',
        backgroundColor: getCardBackground(status)
      }}
    >
      {isCollapsible && (
        <button
          onClick={onToggle}
          className="self-end text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1"
        >
          <ChevronIcon isExpanded={true} />
          recolher
        </button>
      )}

      {/* Cabeçalho do Card */}
      <div className="flex flex-col gap-2">
        <h5 className="text-2xl font-bold text-[var(--color-marinho-itau)]">{usuario}</h5>
        <div className="text-3xl font-bold text-[var(--color-marinho-itau)]">R$ {valor}</div>
        <span className={`inline-block text-sm font-semibold px-3 py-1 w-fit ${getStatusBadgeColor(status)}`}>{status}</span>
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
            <div className="text-xs font-semibold text-gray-600 mb-1">COMPROVANTE</div>
            <a href={receiptLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 1V10M8 10L4 6M8 10L12 6M3 15H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              ver comprovante
            </a>
          </div>
        )}
        */}
      </div>

      {/* Botões de Ação */}
      {status === 'pendente' && (
        <div className="flex gap-3 mt-2 pt-2 border-t border-gray-300 border-opacity-30">
          <button
            onClick={() => onApprove(paymentIds)}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-3 font-semibold transition"
          >
            Aprovar
          </button>
          <button
            onClick={() => onReject(paymentIds)}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 font-semibold transition"
          >
            Rejeitar
          </button>
        </div>
      )}
    </div>
  );
}
