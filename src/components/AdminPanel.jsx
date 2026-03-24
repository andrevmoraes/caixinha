import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { validateAmount, validateDescription, validateTransactionType } from '../lib/validation';
import MetroButton from './MetroButton';
import Skeleton from './Skeleton';
import SectionCard from './SectionCard';
import PaymentCard from './PaymentCard';
import PaymentCardSkeleton from './PaymentCardSkeleton';
import TransactionCard from './TransactionCard';
import TransactionCardSkeleton from './TransactionCardSkeleton';
import ChevronIcon from './ChevronIcon';

export default function AdminPanel({ user }) {
  const [pagamentos, setPagamentos] = useState([]);
  const [transacoes, setTransacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [tipoTransacao, setTipoTransacao] = useState('saida');
  const [valorTransacao, setValorTransacao] = useState('');
  const [descricaoTransacao, setDescricaoTransacao] = useState('');
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [expandedTransactions, setExpandedTransactions] = useState(new Set());
  const [isTransactionHistoryCollapsed, setIsTransactionHistoryCollapsed] = useState(true);
  const isFetchingRef = useRef(false);

  function toggleExpanded(key) {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleExpandedTransaction(id) {
    setExpandedTransactions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  const lastUserId = useRef(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    const initData = async () => {
      if (hasInitialized.current) {
        return;
      }
      
      hasInitialized.current = true;
      
      if (isFetchingRef.current) {
        return;
      }
      
      if (lastUserId.current !== user.id) {
        lastUserId.current = user.id;
        isFetchingRef.current = false;
      }
      
      if (!user.is_admin) {
        console.error('❌ [ADMIN] Usuário não é admin!');
        setError('Você não tem permissão de administrador.');
        setLoading(false);
        return;
      }
      
      const { data: rlsData, error: rlsError } = await supabase.rpc('set_current_user_id', { user_id: user.id });
      
      if (rlsError) {
        console.error('❌ [ADMIN] Erro ao configurar RLS:', rlsError);
        setError(`Erro ao configurar RLS: ${rlsError.message}`);
        setLoading(false);
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      await fetchData();
    };
    
    initData();
    
    return () => {
      hasInitialized.current = false;
      isFetchingRef.current = false;
    };
  }, []);

  async function fetchData() {
    if (isFetchingRef.current) {
      return;
    }
    
    isFetchingRef.current = true;
    
    try {
      setLoading(true);
      setError('');
    
      const { data: rlsReconfig, error: rlsError } = await supabase.rpc('set_current_user_id', { user_id: user.id });
      
      if (rlsError) {
        console.error('❌ [ADMIN] Erro ao reconfigurar RLS:', rlsError);
      }
    
      const pagamentosPromise = supabase
        .from('payments')
        .select('*, profiles(username)')
        .order('created_at', { ascending: false });
      
      const transacoesPromise = supabase
        .from('transactions')
        .select('*, profiles(username)')
        .order('created_at', { ascending: false });
    
      const [pagamentosResult, transacoesResult] = await Promise.all([
        pagamentosPromise,
        transacoesPromise
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
      
      // Colapsa histórico de transações se houver pagamentos pendentes
      const hasPendingPayments = (pagamentosData || []).some(p => p.status === 'pending');
      setIsTransactionHistoryCollapsed(hasPendingPayments);
      
      setLoading(false);
    } catch (error) {
      console.error('❌ [ADMIN] Erro inesperado:', error);
      setError(`Erro inesperado: ${error.message}`);
      setLoading(false);
    } finally {
      isFetchingRef.current = false;
    }
  }

  async function atualizarStatusPorSolicitacao(paymentIds, status) {
    setLoading(true);
    const { data, error } = await supabase.from('payments').update({ status }).in('id', paymentIds);
    if (error) {
      console.error('❌ [ADMIN] Erro ao atualizar status:', error);
    }
    await fetchData();
  }

  async function registrarTransacao() {
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
      console.error('❌ [ADMIN] Erro ao registrar transação:', error);
      alert('Erro ao registrar transação.');
    } else {
      console.log('✅ [ADMIN] Transação registrada com sucesso');
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
    <div className="flex-1 flex flex-col bg-gray-50 overflow-x-hidden">
      {/* Cabeçalho com Título */}
      <div className="bg-white border-b border-gray-200 overflow-x-hidden">
        <div className="max-w-4xl mx-auto px-4 py-6 w-full">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-black text-[var(--color-marinho-itau)] tracking-tight">Painel do Admin</h1>
            <MetroButton 
              onClick={fetchData}
              disabled={loading}
              variant="primary"
              size="md"
              title="Atualizar dados"
            >
              {loading ? 'Atualizando...' : 'Atualizar'}
            </MetroButton>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-4 w-full">
          {/* Saldo Disponível */}
        <SectionCard title="Saldo Disponível">
          {loading ? (
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-3 border-l-4 border-l-[#ff9500] bg-orange-50 p-4 flex flex-col justify-center gap-2">
                <Skeleton width="w-24" height="h-3" />
                <Skeleton width="w-40" height="h-10" />
              </div>
              <div className="flex flex-col gap-3">
                <Skeleton width="w-full" height="h-20" />
                <Skeleton width="w-full" height="h-20" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-3 border-l-4 border-l-[#ff9500] bg-orange-50 p-4 flex flex-col justify-center">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Disponível</div>
                <div className="text-4xl font-bold text-gray-900">R$ {saldoDisponivel.toFixed(2).replace('.', ',')}</div>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => { setTipoTransacao('entrada'); setShowModal(true); }}
                  className="w-full aspect-square border-l-4 border-l-[#16a34a] bg-green-50 hover:bg-green-100 transition flex flex-col items-center justify-center"
                >
                  <div className="text-5xl font-bold text-green-600 leading-none">+</div>
                  <div className="text-[0.625rem] font-semibold text-gray-500 mt-1">Adicionar</div>
                </button>
                <button 
                  onClick={() => { setTipoTransacao('saida'); setShowModal(true); }}
                  className="w-full aspect-square border-l-4 border-l-[#dc2626] bg-red-50 hover:bg-red-100 transition flex flex-col items-center justify-center"
                >
                  <div className="text-5xl font-bold text-red-600 leading-none">−</div>
                  <div className="text-[0.625rem] font-semibold text-gray-500 mt-1">Retirar</div>
                </button>
              </div>
            </div>
          )}
        </SectionCard>

        {/* Erro */}
        {error && (
          <SectionCard className="bg-red-50 border-l-4 border-l-red-600">
            <div className="flex items-center justify-between gap-3">
              <span className="text-red-700">{error}</span>
              <MetroButton 
                onClick={fetchData} 
                variant="danger"
                size="sm"
              >
                Tentar novamente
              </MetroButton>
            </div>
          </SectionCard>
        )}

        {/* Histórico de Transações */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-[var(--color-marinho-itau)] tracking-wide">
              Histórico de Transações
            </h3>
            <button
              onClick={() => setIsTransactionHistoryCollapsed(!isTransactionHistoryCollapsed)}
              className="text-gray-600 hover:text-gray-800 transition flex items-center"
              title={isTransactionHistoryCollapsed ? 'Expandir' : 'Colapsar'}
              aria-label={isTransactionHistoryCollapsed ? 'Expandir histórico de transações' : 'Colapsar histórico de transações'}
            >
              <ChevronIcon isExpanded={!isTransactionHistoryCollapsed} />
            </button>
          </div>
          
          {!isTransactionHistoryCollapsed && (
            <>
              {loading ? (
                <div className="flex flex-col gap-3">
                  {[...Array(3)].map((_, i) => (
                    <TransactionCardSkeleton key={i} />
                  ))}
                </div>
              ) : transacoes.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhuma transação registrada.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {transacoes.map(t => (
                    <TransactionCard
                      key={t.id}
                      tipo={t.tipo}
                      valor={Number(t.valor)}
                      descricao={t.descricao}
                      data={t.created_at}
                      adminNome={t.profiles?.username || 'Sistema'}
                      isExpanded={expandedTransactions.has(t.id)}
                      onToggle={() => toggleExpandedTransaction(t.id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Solicitações de Pagamento */}
        <SectionCard title="Solicitações de Pagamento">
          {loading ? (
            <div className="flex flex-col gap-3">
              {[...Array(5)].map((_, i) => (
                <PaymentCardSkeleton key={i} />
              ))}
            </div>
          ) : pagamentos.length === 0 ? (
            <div className="bg-yellow-50 border-l-4 border-l-yellow-500 p-4">
              <p className="text-yellow-800 font-semibold mb-2">⚠️ Nenhuma solicitação encontrada</p>
              <p className="text-sm text-yellow-700">Verifique se há pagamentos cadastrados no sistema.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {(() => {
                const grouped = pagamentos.reduce((acc, p) => {
                  const key = `${p.user_id}|${p.receipt_url}`;
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(p);
                  return acc;
                }, {});

                const processedGroups = Object.entries(grouped).map(([key, group]) => ({
                  key,
                  group,
                  status: group.some(p => p.status === 'rejected') ? 'rejeitado' : 
                          group.some(p => p.status === 'pending') ? 'pendente' : 'aprovado',
                  statusOrder: group.some(p => p.status === 'rejected') ? 2 : 
                               group.some(p => p.status === 'pending') ? 0 : 1
                }));

                const sorted = processedGroups.sort((a, b) => a.statusOrder - b.statusOrder);

                const groupedByStatus = { pendente: [], aprovado: [], rejeitado: [] };
                sorted.forEach(item => {
                  groupedByStatus[item.status].push(item);
                });

                return (
                  <>
                    {groupedByStatus.pendente.length > 0 && (
                      <div>
                        <h4 className="text-lg font-bold text-gray-700 mb-4">PENDENTES ({groupedByStatus.pendente.length})</h4>
                        <div className="flex flex-col gap-3">
                          {groupedByStatus.pendente.map(({ key, group, status }) => {
                            const usuario = group[0].profiles?.username || '-';
                            const meses = group.map(p => p.month_ref).join(', ');
                            const valor = group.reduce((sum, p) => sum + Number(p.amount), 0).toFixed(2).replace('.', ',');
                            const paymentIds = group.map(p => p.id);
                            const receipt_url = group[0].receipt_url;
                            const receiptLink = receipt_url ? supabase.storage.from('receipts').getPublicUrl(receipt_url).data.publicUrl : null;
                            const isExpanded = expandedItems.has(key);
                            
                            return (
                              <PaymentCard
                                key={key}
                                usuario={usuario}
                                valor={valor}
                                status={status}
                                meses={meses}
                                receiptLink={receiptLink}
                                paymentIds={paymentIds}
                                isExpanded={isExpanded}
                                onToggle={() => toggleExpanded(key)}
                                onApprove={(ids) => atualizarStatusPorSolicitacao(ids, 'approved')}
                                onReject={(ids) => atualizarStatusPorSolicitacao(ids, 'rejected')}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {groupedByStatus.aprovado.length > 0 && (
                      <div>
                        <h4 className="text-lg font-bold text-gray-700 mb-4">APROVADOS ({groupedByStatus.aprovado.length})</h4>
                        <div className="flex flex-col gap-3">
                          {groupedByStatus.aprovado.map(({ key, group, status }) => {
                            const usuario = group[0].profiles?.username || '-';
                            const meses = group.map(p => p.month_ref).join(', ');
                            const valor = group.reduce((sum, p) => sum + Number(p.amount), 0).toFixed(2).replace('.', ',');
                            const paymentIds = group.map(p => p.id);
                            const receipt_url = group[0].receipt_url;
                            const receiptLink = receipt_url ? supabase.storage.from('receipts').getPublicUrl(receipt_url).data.publicUrl : null;
                            const isExpanded = expandedItems.has(key);
                            
                            return (
                              <PaymentCard
                                key={key}
                                usuario={usuario}
                                valor={valor}
                                status={status}
                                meses={meses}
                                receiptLink={receiptLink}
                                paymentIds={paymentIds}
                                isExpanded={isExpanded}
                                onToggle={() => toggleExpanded(key)}
                                onApprove={(ids) => atualizarStatusPorSolicitacao(ids, 'approved')}
                                onReject={(ids) => atualizarStatusPorSolicitacao(ids, 'rejected')}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {groupedByStatus.rejeitado.length > 0 && (
                      <div>
                        <h4 className="text-lg font-bold text-gray-700 mb-4">REJEITADOS ({groupedByStatus.rejeitado.length})</h4>
                        <div className="flex flex-col gap-3">
                          {groupedByStatus.rejeitado.map(({ key, group, status }) => {
                            const usuario = group[0].profiles?.username || '-';
                            const meses = group.map(p => p.month_ref).join(', ');
                            const valor = group.reduce((sum, p) => sum + Number(p.amount), 0).toFixed(2).replace('.', ',');
                            const paymentIds = group.map(p => p.id);
                            const receipt_url = group[0].receipt_url;
                            const receiptLink = receipt_url ? supabase.storage.from('receipts').getPublicUrl(receipt_url).data.publicUrl : null;
                            const isExpanded = expandedItems.has(key);
                            
                            return (
                              <PaymentCard
                                key={key}
                                usuario={usuario}
                                valor={valor}
                                status={status}
                                meses={meses}
                                receiptLink={receiptLink}
                                paymentIds={paymentIds}
                                isExpanded={isExpanded}
                                onToggle={() => toggleExpanded(key)}
                                onApprove={(ids) => atualizarStatusPorSolicitacao(ids, 'approved')}
                                onReject={(ids) => atualizarStatusPorSolicitacao(ids, 'rejected')}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </SectionCard>
        </div>
      </div>

      {/* Modal de Transação */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white border-l-4 border-l-[var(--color-marinho-itau)] p-6 w-full max-w-sm relative overflow-x-hidden">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none" onClick={() => setShowModal(false)}>×</button>
            <h3 className="text-2xl font-bold mb-6 text-[var(--color-marinho-itau)]">
              {tipoTransacao === 'entrada' ? 'Adicionar Dinheiro' : 'Retirar Dinheiro'}
            </h3>
            <div className="flex flex-col gap-4 overflow-x-hidden">
              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide block mb-2">Valor (R$)</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border-b border-gray-300 px-3 py-2 text-sm focus:outline-none focus:bg-white focus:border-b-2 focus:border-[var(--color-laranja-itau)]" 
                  value={valorTransacao}
                  onChange={e => setValorTransacao(e.target.value.replace(/[^0-9,.]/g, ''))}
                  placeholder="Ex: 50,00"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide block mb-2">Descrição/Motivo</label>
                <textarea 
                  className="w-full bg-gray-50 border-b border-gray-300 px-3 py-2 text-sm focus:outline-none focus:bg-white focus:border-b-2 focus:border-[var(--color-laranja-itau)]" 
                  value={descricaoTransacao}
                  onChange={e => setDescricaoTransacao(e.target.value)}
                  placeholder="Ex: Compra de materiais"
                  rows={3}
                />
              </div>
              <MetroButton 
                onClick={registrarTransacao}
                variant="warning"
                className="w-full"
              >
                Confirmar
              </MetroButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
