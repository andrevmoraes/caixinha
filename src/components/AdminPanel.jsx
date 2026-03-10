import { useEffect, useState, useRef } from 'react';
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
  const isFetchingRef = useRef(false);
  const lastUserId = useRef(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Garante que RLS está configurado antes de buscar dados
    const initData = async () => {
      // React 18 Strict Mode chama useEffect duas vezes em desenvolvimento
      // Usamos useRef para garantir execução única
      if (hasInitialized.current) {
        console.log('⚠️ [ADMIN] Componente já inicializado (Strict Mode), ignorando...');
        return;
      }
      
      hasInitialized.current = true;
      
      // Verifica se já está buscando
      if (isFetchingRef.current) {
        console.log('⚠️ [ADMIN] Busca já em andamento, ignorando...');
        return;
      }
      
      // Se mudou de usuário, reseta o estado
      if (lastUserId.current !== user.id) {
        console.log('🔄 [ADMIN] Novo usuário detectado:', user.id);
        lastUserId.current = user.id;
        isFetchingRef.current = false;
      }
      
      console.log('🔧 [ADMIN] Iniciando configuração - user.id:', user.id, 'is_admin:', user.is_admin);
      
      if (!user.is_admin) {
        console.error('❌ [ADMIN] Usuário não é admin!');
        setError('Você não tem permissão de administrador.');
        setLoading(false);
        return;
      }
      
      // Configura o RLS com user_id (isso também configura is_admin automaticamente)
      const { data: rlsData, error: rlsError } = await supabase.rpc('set_current_user_id', { user_id: user.id });
      console.log('🔧 [ADMIN] Resultado RLS - data:', rlsData, 'error:', rlsError);
      
      if (rlsError) {
        console.error('❌ [ADMIN] ERRO ao configurar RLS:', rlsError);
        setError(`Erro ao configurar RLS: ${rlsError.message}`);
        setLoading(false);
        return;
      }
      
      console.log('✅ [ADMIN] RLS configurado com sucesso');
      
      // Verifica se o is_admin foi configurado corretamente
      try {
        const { data: checkData, error: checkError } = await supabase.rpc('get_current_setting', { setting_name: 'app.is_admin' });
        console.log('🔍 [ADMIN] Verificação app.is_admin:', checkData, 'error:', checkError);
      } catch (e) {
        console.log('⚠️ [ADMIN] Não foi possível verificar app.is_admin (função pode não existir)');
      }
      
      // Adiciona um pequeno delay para garantir que o RLS foi aplicado
      console.log('⏳ [ADMIN] Aguardando 200ms para garantir aplicação do RLS...');
      await new Promise(resolve => setTimeout(resolve, 200));
      console.log('✅ [ADMIN] Delay concluído, iniciando busca de dados...');
      
      await fetchData();
    };
    
    initData();
    
    // Cleanup: reseta os flags quando o componente desmonta
    return () => {
      console.log('🧹 [ADMIN] Cleanup do useEffect');
      hasInitialized.current = false;
      isFetchingRef.current = false;
    };
  }, []); // Array vazio: executa apenas uma vez

  async function fetchData() {
    // Proteção síncrona com useRef
    if (isFetchingRef.current) {
      console.log('⚠️ [ADMIN] fetchData já está em execução, abortando...');
      return;
    }
    
    // Marca como executando IMEDIATAMENTE
    isFetchingRef.current = true;
    
    const fetchId = Date.now();
    
    try {
      console.log(`🔍 [ADMIN-${fetchId}] Buscando dados...`);
      console.log(`🔍 [ADMIN-${fetchId}] User ID atual:`, user.id);
      console.log(`🔍 [ADMIN-${fetchId}] Is admin:`, user.is_admin);
      console.log(`🔍 [ADMIN-${fetchId}] Timestamp:`, new Date().toISOString());
      
      setLoading(true);
      setError('');
    
      // CRÍTICO: Reconfigura RLS IMEDIATAMENTE antes das queries
      // Isso garante que app.is_admin está configurado na conexão atual
      console.log(`🔧 [ADMIN-${fetchId}] Reconfigurando RLS antes das queries...`);
      const { data: rlsReconfig, error: rlsError } = await supabase.rpc('set_current_user_id', { user_id: user.id });
      console.log(`🔧 [ADMIN-${fetchId}] RLS reconfigurado - data:`, rlsReconfig, 'error:', rlsError);
      
      if (rlsError) {
        console.error(`❌ [ADMIN-${fetchId}] Erro ao reconfigurar RLS:`, rlsError);
      }
    
      // Faz as duas consultas em paralelo e aguarda ambas
      console.log(`📡 [ADMIN-${fetchId}] Iniciando query de pagamentos...`);
      const pagamentosPromise = supabase
        .from('payments')
        .select('*, profiles(username)')
        .order('created_at', { ascending: false });
      
      console.log(`📡 [ADMIN-${fetchId}] Iniciando query de transações...`);
      const transacoesPromise = supabase
        .from('transactions')
        .select('*, profiles(username)')
        .order('created_at', { ascending: false });
    
    const [pagamentosResult, transacoesResult] = await Promise.all([
      pagamentosPromise,
      transacoesPromise
    ]);
    
    const { data: pagamentosData, error: pagamentosError, status: pagamentosStatus, statusText: pagamentosStatusText } = pagamentosResult;
    const { data: transacoesData, error: transacoesError, status: transacoesStatus, statusText: transacoesStatusText } = transacoesResult;
    
    console.log(`📊 [ADMIN-${fetchId}] Resultado pagamentos - status:`, pagamentosStatus, 'statusText:', pagamentosStatusText);
    console.log(`📊 [ADMIN-${fetchId}] Pagamentos - data:`, pagamentosData?.length, 'error:', pagamentosError);
    if (pagamentosError) {
      console.error(`❌ [ADMIN-${fetchId}] ERRO DETALHADO pagamentos:`, JSON.stringify(pagamentosError, null, 2));
    }
    
    console.log(`📊 [ADMIN-${fetchId}] Resultado transações - status:`, transacoesStatus, 'statusText:', transacoesStatusText);
    console.log(`📊 [ADMIN-${fetchId}] Transações - data:`, transacoesData?.length, 'error:', transacoesError);
    if (transacoesError) {
      console.error(`❌ [ADMIN-${fetchId}] ERRO DETALHADO transações:`, JSON.stringify(transacoesError, null, 2));
    }
    
    if (pagamentosError) {
      console.error(`❌ [ADMIN-${fetchId}] Erro ao carregar pagamentos:`, pagamentosError);
      setError(`Erro ao carregar pagamentos: ${pagamentosError.message}`);
    } else {
      console.log(`✅ [ADMIN-${fetchId}] Pagamentos carregados:`, pagamentosData?.length || 0);
      if (pagamentosData?.length === 0) {
        console.warn(`⚠️ [ADMIN-${fetchId}] ATENÇÃO: Nenhum pagamento retornado! Pode ser problema de RLS.`);
      }
    }
    
    if (transacoesError) {
      console.error(`❌ [ADMIN-${fetchId}] Erro ao carregar transações:`, transacoesError);
      setError(prev => prev + ` Erro ao carregar transações: ${transacoesError.message}`);
    } else {
      console.log(`✅ [ADMIN-${fetchId}] Transações carregadas:`, transacoesData?.length || 0);
    }
    
    console.log(`💾 [ADMIN-${fetchId}] Salvando no estado - pagamentos:`, pagamentosData?.length || 0, 'transações:', transacoesData?.length || 0);
    setPagamentos(pagamentosData || []);
    setTransacoes(transacoesData || []);
    setLoading(false);
    } catch (error) {
      console.error(`❌ [ADMIN-${fetchId}] Erro inesperado:`, error);
      setError(`Erro inesperado: ${error.message}`);
      setLoading(false);
    } finally {
      // Libera o lock SEMPRE, mesmo em caso de erro
      isFetchingRef.current = false;
      console.log(`✅ [ADMIN-${fetchId}] Fetch completo, lock liberado`);
    }
  }

  async function atualizarStatusPorSolicitacao(receipt_url, status) {
    console.log('🔄 [ADMIN] Atualizando status - receipt_url:', receipt_url, 'novo status:', status);
    setLoading(true);
    const { data, error } = await supabase.from('payments').update({ status }).eq('receipt_url', receipt_url);
    console.log('🔄 [ADMIN] Resultado update - data:', data, 'error:', error);
    await fetchData();
  }

  async function registrarTransacao() {
    console.log('💰 [ADMIN] Registrando transação - tipo:', tipoTransacao, 'valor:', valorTransacao, 'descrição:', descricaoTransacao);
    
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
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
            <p className="text-yellow-800 font-semibold mb-2">⚠️ Nenhuma solicitação de pagamento encontrada</p>
            <p className="text-sm text-yellow-700">
              Se você é administrador e deveria ver pagamentos aqui:
            </p>
            <ul className="text-xs text-yellow-700 mt-2 ml-4 list-disc">
              <li>Verifique se você aplicou o script <code className="bg-yellow-100 px-1">supabase_security_policies.sql</code> no Supabase</li>
              <li>Confirme que há pagamentos cadastrados no sistema</li>
              <li>Verifique se seu usuário tem <code className="bg-yellow-100 px-1">is_admin = true</code> na tabela profiles</li>
              <li>Tente clicar no botão "↻ Atualizar" acima</li>
            </ul>
          </div>
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
