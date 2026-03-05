import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { validateSelectedMonths, validateReceiptFile } from '../lib/validation';

const MESES_2026 = [
  'Janeiro/2026', 'Fevereiro/2026', 'Março/2026', 'Abril/2026',
  'Maio/2026', 'Junho/2026', 'Julho/2026', 'Agosto/2026',
  'Setembro/2026', 'Outubro/2026', 'Novembro/2026', 'Dezembro/2026'
];

export default function UserDashboard({ user }) {
  const [pagamentos, setPagamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState('');
  const [file, setFile] = useState(null);
    // Se houver arquivo compartilhado via Web Share Target, já preencher
    useEffect(() => {
      if (window.sharedFile) {
        setFile(window.sharedFile);
        window.sharedFile = undefined;
      }
    }, []);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedMeses, setSelectedMeses] = useState([]);
  const [valor, setValor] = useState('');
    // Atualiza valor automaticamente ao selecionar meses
    React.useEffect(() => {
      setValor(selectedMeses.length > 0 ? (selectedMeses.length * 10).toFixed(2).replace('.', ',') : '');
    }, [selectedMeses]);
  const pixKey = '19997132723';
  const inputRef = useRef();

  useEffect(() => {
    // Garante que RLS está configurado antes de buscar dados
    const initData = async () => {
      console.log('🔧 [DASHBOARD] Configurando RLS antes de buscar dados...');
      await supabase.rpc('set_current_user_id', { user_id: user.id });
      await fetchPagamentos();
    };
    initData();
  }, [user.id]);
  
  async function fetchPagamentos() {
    setLoading(true);
    setLoadingError('');
    console.log('🔍 [DASHBOARD] Buscando pagamentos para user_id:', user.id);
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) {
      console.error('❌ [DASHBOARD] Erro ao buscar pagamentos:', error);
      setLoadingError(`Erro ao carregar dados: ${error.message}`);
      setPagamentos([]);
    } else {
      console.log('✅ [DASHBOARD] Pagamentos carregados:', data?.length || 0);
      setPagamentos(data || []);
    }
    setLoading(false);
  }

  const mesesPagos = pagamentos.filter(p => p.status === 'approved').map(p => p.month_ref);
  const mesesPendentes = MESES_2026.filter(m => {
    // Se existe pagamento para o mês, mas não está aprovado, é pendente
    return pagamentos.some(p => p.month_ref === m && p.status === 'pending');
  });
  const mesesDisponiveis = MESES_2026.filter(m => !mesesPagos.includes(m) && !mesesPendentes.includes(m));
  const debito = (new Date().getFullYear() === 2026 ? (new Date().getMonth() + 1) : 12) * 10 - pagamentos.filter(p => p.status === 'approved').length * 10;

  async function handleUpload(e) {
    e.preventDefault();
    
    // Validação de meses
    const monthsValidation = validateSelectedMonths(selectedMeses);
    if (!monthsValidation.valid) {
      setUploadMsg(monthsValidation.error);
      return;
    }

    // Validação de arquivo
    const fileValidation = validateReceiptFile(file);
    if (!fileValidation.valid) {
      setUploadMsg(fileValidation.error);
      return;
    }

    setUploading(true);
    setUploadMsg('');
    const fileExt = file.name.split('.').pop();
    // Remove acentos, barras e caracteres especiais dos nomes dos meses
    const sanitize = (str) => str
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
      .replace(/[^a-zA-Z0-9_-]/g, '_'); // substitui caracteres especiais por underscore
    const safeMeses = monthsValidation.sanitized.map(m => sanitize(m));
    const filePath = `${user.id}/${safeMeses.join('_')}.${fileExt}`;
    let { error: uploadError } = await supabase.storage.from('receipts').upload(filePath, file);
    if (uploadError) {
      setUploadMsg(`Erro ao enviar comprovante: ${uploadError.message}`);
      setUploading(false);
      return;
    }
    // Cria um registro para cada mês selecionado
    console.log('📝 [UPLOAD] Criando registros de pagamento - user.id:', user.id);
    let erroRegistro = null;
    for (const month_ref of monthsValidation.sanitized) {
      console.log('💾 [UPLOAD] Inserindo mês:', month_ref);
      const { data: insertData, error: insertError } = await supabase.from('payments').insert({
        user_id: user.id,
        month_ref,
        amount: 10.00,
        receipt_url: filePath,
        status: 'pending'
      });
      console.log('📊 [UPLOAD] Resultado INSERT - data:', insertData, 'error:', insertError);
      if (insertError) {
        console.error('❌ [UPLOAD] ERRO COMPLETO:', JSON.stringify(insertError, null, 2));
        erroRegistro = insertError;
      }
    }
    if (erroRegistro) {
      setUploadMsg(`Erro ao registrar pagamento: ${erroRegistro.message}, code: ${erroRegistro.code}`);
    } else {
      setUploadMsg('Comprovante enviado! Aguarde aprovação.');
      setFile(null);
      setSelectedMeses([]);
      setValor('');
      // Recarrega lista de pagamentos
      await fetchPagamentos();
    }
    setUploading(false);
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded shadow p-4 sm:p-6 mt-4 sm:mt-8 border border-[var(--color-laranja-itau)]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-[var(--color-marinho-itau)] tracking-wide">Olá, {user.username}!</h2>
        <button 
          onClick={fetchPagamentos}
          disabled={loading}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Atualizar dados"
        >
          {loading ? '⟳' : '↻'}
        </button>
      </div>
      {loadingError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {loadingError}
        </div>
      )}
      {/* Grade de meses */}
      {/* Removido: meses pendentes em texto, pois agora é visual na grade */}
      <form onSubmit={handleUpload} className="mb-4 flex flex-col gap-3">
        <label className="block mb-2 font-semibold">Selecione os meses que está pagando:</label>
        <div className="text-center font-bold text-lg mb-2">2026</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
          {MESES_2026.map(mes => {
            const isPago = mesesPagos.includes(mes);
            const isPendente = mesesPendentes.includes(mes);
            const isDisponivel = !isPago && !isPendente;
            const isSelecionado = selectedMeses.includes(mes);
            // Extrai só o nome do mês
            const nomeMes = mes.split('/')[0];
            return (
              <button
                type="button"
                key={mes}
                className={
                  `rounded px-4 py-4 text-base font-semibold border transition focus:outline-none text-center w-full min-h-[48px] ` +
                  (isPago
                    ? 'bg-green-100 border-green-400 text-green-700 cursor-not-allowed line-through'
                    : isPendente
                      ? 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed'
                      : isSelecionado
                        ? 'bg-[var(--color-laranja-itau)] border-[var(--color-laranja-itau)] text-white shadow-lg scale-105'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-orange-50 hover:border-[var(--color-laranja-itau)]')
                }
                disabled={!isDisponivel || uploading}
                onClick={() => {
                  if (!isDisponivel) return;
                  if (isSelecionado) setSelectedMeses(selectedMeses.filter(m => m !== mes));
                  else setSelectedMeses([...selectedMeses, mes]);
                }}
                tabIndex={!isDisponivel ? -1 : 0}
                aria-pressed={isSelecionado}
              >
                {nomeMes}
              </button>
            );
          })}
        </div>
        {/* Botões e chave PIX abaixo dos meses */}
        <div className="flex flex-col items-center gap-2 mb-2 mt-2">
          <div>
            <span className="font-semibold">Chave PIX:</span> <span className="select-all">{pixKey}</span>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              className="bg-[var(--color-laranja-itau)] text-white px-3 py-1 rounded font-semibold hover:bg-orange-700 transition text-sm"
              onClick={() => {
                navigator.clipboard.writeText(pixKey);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? 'Copiado!' : 'Copiar chave'}
            </button>
            <a
              href={`https://wa.me/551140041515?text=Enviar%20para%20${pixKey}%20o%20valor%20de%20R%24%20${selectedMeses.length > 0 ? valor : ''}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 text-white px-3 py-1 rounded font-semibold hover:bg-green-700 transition text-sm flex items-center"
            >
              PIX via WhatsApp
            </a>
          </div>
        </div>
        <div className="mb-2">
          <span className="font-semibold">Resumo:</span>
          {selectedMeses.length > 0 ? (
            <span className="ml-2">Você está pagando <span className="font-bold">R$ {valor}</span> <span className="text-[var(--color-laranja-itau)] font-bold">({selectedMeses.join(', ')})</span></span>
          ) : (
            <span className="ml-2 text-gray-500">Selecione os meses acima</span>
          )}
        </div>
        <label className="block mb-2 font-semibold">Anexar comprovante:</label>
        <input 
          type="file" 
          accept="image/*,application/pdf" 
          onChange={e => setFile(e.target.files[0])} 
          className="mb-2 border rounded p-2" 
          disabled={uploading}
          key={uploadMsg} 
        />
        <button type="submit" className="bg-[var(--color-laranja-itau)] text-white px-4 py-2 rounded font-semibold hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed" disabled={!file || uploading || selectedMeses.length === 0}>
          {uploading ? 'Enviando...' : 'Enviar comprovante'}
        </button>
        {uploadMsg && <div className={`mt-2 text-sm font-semibold ${uploadMsg.includes('Erro') ? 'text-red-600' : 'text-green-700'}`}>{uploadMsg}</div>}
      </form>
      <h3 className="font-semibold mb-2">Histórico de solicitações</h3>
      {loading ? <p>Carregando...</p> : (
        <ul className="text-sm">
          {Object.entries(
            pagamentos.reduce((acc, p) => {
              if (!acc[p.receipt_url]) acc[p.receipt_url] = [];
              acc[p.receipt_url].push(p);
              return acc;
            }, {})
          )
            .sort((a, b) => {
              // Ordena pela data mais recente do grupo (usando created_at do primeiro registro do grupo)
              const dateA = new Date(a[1][0].created_at);
              const dateB = new Date(b[1][0].created_at);
              return dateB - dateA;
            })
            .map(([receipt_url, group]) => {
            // Meses agrupados
            const meses = group.map(p => p.month_ref).join(', ');
            // Valor total
            const valor = group.reduce((sum, p) => sum + Number(p.amount), 0).toFixed(2).replace('.', ',');
            // Status geral
            let status = 'aprovado';
            if (group.some(p => p.status === 'rejected')) status = 'rejeitado';
            else if (group.some(p => p.status === 'pending')) status = 'pendente';
            // Link comprovante
            const receiptLink = receipt_url ? supabase.storage.from('receipts').getPublicUrl(receipt_url).data.publicUrl : null;
            return (
              <li key={receipt_url} className="mb-2 border-b pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <span className="font-semibold">Meses:</span> {meses}<br/>
                    <span className="font-semibold">Valor:</span> R$ {valor}<br/>
                    <span className="font-semibold">Status:</span> <span className={
                      status === 'aprovado' ? 'text-green-600' : status === 'pendente' ? 'text-yellow-600' : 'text-red-600'
                    }>{status}</span>
                  </div>
                  <div>
                    {receiptLink && (
                      <a href={receiptLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Ver comprovante</a>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
