import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { validateAmount, validateDescription, validateTransactionType } from '../lib/validation';

export default function AdminPanel({ user }) {
  const [pagamentos, setPagamentos] = useState([]);
  const [transacoes, setTransacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [tipoTransacao, setTipoTransacao] = useState('saida');
  const [valorTransacao, setValorTransacao] = useState('');
  const [descricaoTransacao, setDescricaoTransacao] = useState('');

  useEffect(() => {
    // Garante que RLS está configurado antes de buscar dados
    const initData = async () => {
      console.log('🔧 [ADMIN] Configurando RLS antes de buscar dados...');
      await supabase.rpc('set_current_user_id', { user_id: user.id });
      await fetchData();
    };
    initData();
  }, [user.id]);

  async function fetchData() {
    setLoading(true);
    setError('');
    
    console.log('🔍 [ADMIN] Buscando dados...');
    
    // Faz as duas consultas em paralelo e aguarda ambas
    const [pagamentosResult, transacoesResult] = await Promise.all([
      supabase
        .from('payments')
        .select('*, profiles(username)')
        .order('created_at', { ascending: false }),
      supabase
        .from('transactions')
        .select('*, profiles(username)')
        .order('created_at', { ascending: false })
    ]);
    
    const { data: pagamentosData, error: pagamentosError } = pagamentosResult;
    const { data: transacoesData, error: transacoesError } = transacoesResult;
    
    if (pagamentosError) {
      console.error('❌ [ADMIN] Erro ao carregar pagamentos:', pagamentosError);
      setError(`Erro ao carregar pagamentos: ${pagamentosError.message}`);
    } else {
      console.log('✅ [ADMIN] Pagamentos carregados:', pagamentosData?.length || 0);
    }
    
    if (transacoesError) {
      console.error('❌ [ADMIN] Erro ao carregar transações:', transacoesError);
      setError(prev => prev + ` Erro ao carregar transações: ${transacoesError.message}`);
    } else {
      console.log('✅ [ADMIN] Transações carregadas:', transacoesData?.length || 0);
    }
    
    setPagamentos(pagamentosData || []);
    setTransacoes(transacoesData || []);
    setLoading(false);
  }

  async function atualizarStatusPorSolicitacao(receipt_url, status) {
    setLoading(true);
    await supabase.from('payments').update({ status }).eq('receipt_url', receipt_url);
    await fetchData();
  }

  async function registrarTransacao() {
    // Validação
    const valorValidation = validateAmount(valorTransacao);
    if (!valorValidation.valid) {
      alert(valorValidation.error);
      return;
    }

    const descricaoValidation = validateDescription(descricaoTransacao);
    if (!descricaoValidation.valid) {
      alert(descricaoValidation.error);
      return;
    }

    const tipoValidation = validateTransactionType(tipoTransacao);
    if (!tipoValidation.valid) {
      alert(tipoValidation.error);
      return;
    }

    const { error } = await supabase.from('transactions').insert({
      tipo: tipoValidation.sanitized,
      valor: valorValidation.sanitized,
      descricao: descricaoValidation.sanitized,
      admin_id: user.id
    });
    if (error) {
      alert('Erro ao registrar transação.');
    } else {
      setShowModal(false);
      setValorTransacao('');
      setDescricaoTransacao('');
      await fetchData();
    }
  }

  // Calcular saldo
  const totalPagamentosAprovados = pagamentos
    .filter(p => p.status === 'approved')
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const totalEntradas = transacoes
    .filter(t => t.tipo === 'entrada')
    .reduce((sum, t) => sum + Number(t.valor), 0);
  const totalSaidas = transacoes
    .filter(t => t.tipo === 'saida')
    .reduce((sum, t) => sum + Number(t.valor), 0);
  const saldoDisponivel = totalPagamentosAprovados + totalEntradas - totalSaidas;

  return (
    <div className="max-w-2xl mx-auto bg-white rounded shadow p-4 sm:p-6 mt-4 sm:mt-8 border border-[var(--color-laranja-itau)]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-[var(--color-marinho-itau)] tracking-wide">Painel do Admin</h2>
        <button 
          onClick={fetchData}
          disabled={loading}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Atualizar dados"
        >
          {loading ? '⟳' : '↻'} Atualizar
        </button>
      </div>
      
      {/* Saldo Disponível */}
      <div className="bg-[var(--color-laranja-itau)] text-white rounded-lg p-4 mb-4 shadow">
        <div className="text-sm">Saldo Disponível</div>
        <div className="text-3xl font-bold">R$ {saldoDisponivel.toFixed(2).replace('.', ',')}</div>
        <div className="flex gap-2 mt-3">
          <button 
            onClick={() => { setTipoTransacao('entrada'); setShowModal(true); }}
            className="bg-green-500 text-white px-3 py-2 rounded font-semibold hover:bg-green-600 transition"
          >
            Adicionar Dinheiro
          </button>
          <button 
            onClick={() => { setTipoTransacao('saida'); setShowModal(true); }}
            className="bg-red-500 text-white px-3 py-2 rounded font-semibold hover:bg-red-600 transition"
          >
            Retirar Dinheiro
          </button>
        </div>
      </div>

      {error && <div className="text-red-600 mb-2">
        {error}
        <button 
          onClick={fetchData} 
          className="ml-2 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
        >
          Tentar novamente
        </button>
      </div>}
      
      {/* Modal de Transação */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-sm relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-black" onClick={() => setShowModal(false)}>&times;</button>
            <h3 className="text-xl font-bold mb-4 text-[var(--color-marinho-itau)]">
              {tipoTransacao === 'entrada' ? 'Adicionar Dinheiro' : 'Retirar Dinheiro'}
            </h3>
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium">Valor (R$)</label>
              <input 
                type="text" 
                className="border rounded px-3 py-2" 
                value={valorTransacao}
                onChange={e => setValorTransacao(e.target.value.replace(/[^0-9,.]/g, ''))}
                placeholder="Ex: 50,00"
              />
              <label className="text-sm font-medium">Descrição/Motivo</label>
              <textarea 
                className="border rounded px-3 py-2" 
                value={descricaoTransacao}
                onChange={e => setDescricaoTransacao(e.target.value)}
                placeholder="Ex: Compra de materiais"
                rows={3}
              />
              <button 
                onClick={registrarTransacao}
                className="bg-[var(--color-laranja-itau)] text-white py-2 rounded font-semibold hover:bg-orange-700 transition"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Histórico de Transações */}
      <div className="mb-6">
        <h3 className="text-lg font-bold mb-2 text-[var(--color-marinho-itau)]">Histórico de Transações</h3>
        {loading ? <p>Carregando...</p> : (
          transacoes.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhuma transação registrada.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {transacoes.map(t => (
                <div key={t.id} className="border rounded p-3 bg-gray-50 flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{t.descricao}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(t.created_at).toLocaleDateString('pt-BR')} - {t.profiles?.username || 'Admin'}
                    </div>
                  </div>
                  <div className={`font-bold text-lg ${t.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.tipo === 'entrada' ? '+' : '-'} R$ {Number(t.valor).toFixed(2).replace('.', ',')}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Solicitações de Pagamento */}
      <h3 className="text-lg font-bold mb-2 text-[var(--color-marinho-itau)]">Solicitações de Pagamento</h3>
      {loading ? <p>Carregando...</p> : (
        pagamentos.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhuma solicitação de pagamento.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {Object.entries(
              pagamentos.reduce((acc, p) => {
                const key = `${p.user_id}|${p.receipt_url}`;
                if (!acc[key]) acc[key] = [];
                acc[key].push(p);
                return acc;
              }, {})
            ).map(([key, group]) => {
            const usuario = group[0].profiles?.username || '-';
            const meses = group.map(p => p.month_ref).join(', ');
            const valor = group.reduce((sum, p) => sum + Number(p.amount), 0).toFixed(2).replace('.', ',');
            let status = 'aprovado';
            if (group.some(p => p.status === 'rejected')) status = 'rejeitado';
            else if (group.some(p => p.status === 'pending')) status = 'pendente';
            const receipt_url = group[0].receipt_url;
            const receiptLink = receipt_url ? supabase.storage.from('receipts').getPublicUrl(receipt_url).data.publicUrl : null;
            return (
              <div key={key} className="border-2 border-[var(--color-laranja-itau)] rounded-lg p-4 bg-gray-50 shadow flex flex-col gap-2">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                  <div className="font-bold text-[var(--color-marinho-itau)]">{usuario}</div>
                  <div className="font-semibold">R$ {valor}</div>
                  <div>
                    <span className={
                      'font-semibold ' +
                      (status === 'aprovado' ? 'text-green-600' : status === 'pendente' ? 'text-yellow-600' : 'text-red-600')
                    }>{status}</span>
                  </div>
                </div>
                <div className="text-sm"><span className="font-semibold">Meses:</span> {meses}</div>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="font-semibold">Comprovante:</span>
                  {receiptLink ? (
                    <a href={receiptLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">Ver</a>
                  ) : '-'}
                </div>
                {status === 'pendente' && (
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => atualizarStatusPorSolicitacao(receipt_url, 'approved')} className="bg-green-500 text-white px-3 py-2 rounded font-semibold">Aprovar</button>
                    <button onClick={() => atualizarStatusPorSolicitacao(receipt_url, 'rejected')} className="bg-red-500 text-white px-3 py-2 rounded font-semibold">Rejeitar</button>
                  </div>
                )}
              </div>
            );
          })}
          </div>
        )
      )}
    </div>
  );
}
