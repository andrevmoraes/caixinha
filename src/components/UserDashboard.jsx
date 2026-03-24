import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { validateSelectedMonths, validateReceiptFile, decodeHtmlEntities } from '../lib/validation';
import { MESES_2026, PIX_KEY, WHATSAPP_NUMBER, SUCCESS_MESSAGES } from '../constants';
import MetroButton from './MetroButton';
import SectionCard from './SectionCard';
import HistoryCard from './HistoryCard';
import HistoryCardSkeleton from './HistoryCardSkeleton';
import Skeleton from './Skeleton';

export default function UserDashboard({ user }) {
  const [pagamentos, setPagamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState('');
  const [file, setFile] = useState(null);
  const [expandedHistory, setExpandedHistory] = useState(new Set());
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
  const inputRef = useRef();

  function toggleExpandedHistory(receiptUrl) {
    setExpandedHistory(prev => {
      const next = new Set(prev);
      if (next.has(receiptUrl)) next.delete(receiptUrl);
      else next.add(receiptUrl);
      return next;
    });
  }

  async function ensureRlsContext(reason = 'generic') {
    const { data, error } = await supabase.rpc('set_current_user_id', { user_id: user.id });
    if (error) {
      console.error(`❌ [RLS] Falha ao configurar contexto (${reason})`, error);
      throw error;
    }
  }

  async function logRlsSnapshot(label) {
    // RLS snapshot disabled for production - uncomment for debugging if needed
    // console.group(`🧪 [RLS-SNAPSHOT] ${label}`);
    // console.log('👤 user.id:', user.id, 'username:', user.username);
    // ... more detailed logs
    // console.groupEnd();
  }

  useEffect(() => {
    // Garante que RLS está configurado antes de buscar dados
    const initData = async () => {
      try {
        await ensureRlsContext('init');
      } catch (rlsError) {
        console.error('❌ [DASHBOARD] ERRO ao configurar RLS:', rlsError);
      }
      await fetchPagamentos();
    };
    initData();
  }, [user.id]);
  
  async function fetchPagamentos() {
    setLoading(true);
    setLoadingError('');
    
    try {
      await ensureRlsContext('fetch_pagamentos');
    } catch (rlsError) {
      console.error('❌ [DASHBOARD] Erro ao reconfigurar RLS:', rlsError);
    }
    
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) {
      console.error('❌ [DASHBOARD] Erro ao buscar pagamentos:', error);
      setLoadingError(`Erro ao carregar dados: ${error.message}`);
      setPagamentos([]);
    } else {
      const normalizedData = (data || []).map((payment) => ({
        ...payment,
        month_ref: decodeHtmlEntities(payment.month_ref)
      }));
      console.log('✅ [DASHBOARD] Pagamentos carregados:', data?.length || 0);
      setPagamentos(normalizedData);
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

    try {
      await ensureRlsContext('upload_start');
    } catch (rlsError) {
      setUploadMsg(`Erro ao configurar sessão de upload: ${rlsError.message}`);
      setUploading(false);
      return;
    }

    let uploadedFilePath = null;

    // Fazer upload do arquivo se fornecido
    if (file) {
      const fileExt = file.name.split('.').pop();
      const sanitize = (str) => str
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_');
      const mesesSelecionados = [...selectedMeses];
      const safeMeses = mesesSelecionados.map(m => sanitize(m));
      const filePath = `${user.id}/${safeMeses.join('_')}.${fileExt}`;

      const uploadFile = async () => supabase.storage.from('receipts').upload(filePath, file);
      let { error: uploadError } = await uploadFile();

      if (uploadError) {
        console.error('❌ [UPLOAD] Erro no upload:', uploadError.message);
      }

      // Em ambientes com pooling, tenta reconfigurar e retry uma vez
      if (uploadError && /row-level security|violates row-level security policy/i.test(uploadError.message || '')) {
        console.warn('⚠️ [UPLOAD] Erro de RLS. Reconfigurando e tentando novamente...');
        try {
          await ensureRlsContext('upload_retry');
          await logRlsSnapshot('antes do retry do upload');
        } catch (rlsError) {
          console.error('❌ [UPLOAD] Falha ao reconfigurar RLS para retry:', rlsError);
        }
        const retry = await uploadFile();
        uploadError = retry.error;
        if (uploadError) {
          console.error('❌ [UPLOAD] Retry falhou:', uploadError.message);
        }
      }

      if (uploadError) {
        setUploadMsg(`Erro ao registrar pagamento: ${uploadError.message}`);
        setUploading(false);
        return;
      }

      uploadedFilePath = filePath;
    }

    // Cria registros de pagamento para cada mês
    const mesesSelecionados = [...selectedMeses];
    let erroRegistro = null;
    for (const month_ref of mesesSelecionados) {
      let { data: insertData, error: insertError } = await supabase.from('payments').insert({
        user_id: user.id,
        month_ref,
        amount: 10.00,
        receipt_url: uploadedFilePath,
        status: 'pending'
      });

      if (insertError && /row-level security|violates row-level security policy/i.test(insertError.message || '')) {
        console.warn('⚠️ [UPLOAD] Erro de RLS ao inserir. Reconfigurando e tentando novamente...');
        try {
          await ensureRlsContext(`insert_retry_${month_ref}`);
        } catch (rlsError) {
          console.error('❌ [UPLOAD] Falha ao reconfigurar RLS:', rlsError);
        }
        const retryInsert = await supabase.from('payments').insert({
          user_id: user.id,
          month_ref,
          amount: 10.00,
          receipt_url: filePath,
          status: 'pending'
        });
        insertData = retryInsert.data;
        insertError = retryInsert.error;
      }

      if (insertError) {
        console.error('❌ [UPLOAD] Erro ao inserir pagamento:', insertError.message);
        erroRegistro = insertError;
      }
    }
    if (erroRegistro) {
      setUploadMsg(`Erro ao registrar pagamento: ${erroRegistro.message}`);
    } else {
      setUploadMsg(SUCCESS_MESSAGES.receiptUploaded);
      setFile(null);
      setSelectedMeses([]);
      setValor('');
      await fetchPagamentos();
    }
    setUploading(false);
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-x-hidden">
      {/* Cabeçalho com Título */}
      <div className="bg-white border-b border-gray-200 overflow-x-hidden">
        <div className="max-w-4xl mx-auto px-4 py-6 w-full">
          <div className="flex justify-between items-center gap-4">
            <h1 className="text-3xl font-black text-[var(--color-marinho-itau)] tracking-tight">Olá, {user.username}!</h1>
            <MetroButton 
              onClick={fetchPagamentos}
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
          {/* Erro */}
        {loadingError && (
          <SectionCard className="bg-red-50 border-l-4 border-l-red-600">
            <span className="text-red-700">{loadingError}</span>
          </SectionCard>
        )}

        {/* Formulário de Pagamento */}
        <SectionCard title="Registrar Pagamento">
          <form onSubmit={handleUpload} className="flex flex-col gap-4 overflow-x-hidden">
            <div>
              <label className="block mb-2 font-semibold text-sm">Selecione os meses que está pagando:</label>
              <div className="text-center font-bold text-sm mb-2 text-gray-600">2026</div>
              {loading ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
                  {[...Array(12)].map((_, i) => (
                    <Skeleton key={i} width="w-full" height="h-9" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
                  {MESES_2026.map(mes => {
                  const isPago = mesesPagos.includes(mes);
                  const isPendente = mesesPendentes.includes(mes);
                  const isDisponivel = !isPago && !isPendente;
                  const isSelecionado = selectedMeses.includes(mes);
                  const nomeMes = mes.split('/')[0];
                  return (
                    <button
                      type="button"
                      key={mes}
                      className={`px-3 py-2 text-xs font-semibold transition focus:outline-none text-center ${
                        isPago
                          ? 'bg-green-100 text-green-700 cursor-not-allowed line-through'
                          : isPendente
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : isSelecionado
                              ? 'bg-orange-100 text-[var(--color-laranja-itau)]'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-orange-50'
                      }`}
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
              )}
            </div>

            {/* Informações PIX */}
            <div className="bg-blue-50 border-l-4 border-l-blue-600 p-4 flex flex-col gap-3">
              <div>
                <span className="font-semibold text-sm">Chave PIX:</span>
                <span className="select-all text-sm ml-2 font-mono">{PIX_KEY}</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <MetroButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(PIX_KEY);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                >
                  {copied ? '✓ Copiado!' : 'Copiar chave'}
                </MetroButton>
                <MetroButton
                  type="button"
                  variant="success"
                  size="sm"
                  onClick={() => {
                    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=Enviar%20para%20${PIX_KEY}%20o%20valor%20de%20R%24%20${selectedMeses.length > 0 ? valor : ''}`);
                  }}
                >
                  PIX via WhatsApp
                </MetroButton>
              </div>
            </div>

            {/* Resumo */}
            {selectedMeses.length > 0 && (
              <div className="bg-orange-50 border-l-4 border-l-[var(--color-laranja-itau)] p-4">
                <span className="font-semibold text-sm">Resumo:</span>
                <span className="ml-2 text-sm">Você está pagando <span className="font-bold">R$ {valor}</span> para os meses de {selectedMeses.join(', ')}</span>
              </div>
            )}

            {/* Upload - DESATIVADO TEMPORARIAMENTE */}
            {/* 
            <div>
              <label className="block mb-2 font-semibold text-sm">Anexar comprovante:</label>
              <input 
                type="file" 
                id="file-upload"
                accept="image/*,application/pdf" 
                onChange={e => setFile(e.target.files[0])} 
                className="hidden"
                disabled={uploading}
                key={uploadMsg} 
                aria-label="Selecionar arquivo"
              />
              
              {!file ? (
                <label 
                  htmlFor="file-upload"
                  className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-[var(--color-laranja-itau)] bg-orange-50 hover:bg-orange-100 transition cursor-pointer text-sm font-semibold text-[var(--color-laranja-itau)]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 1110.233-2.33A4.502 4.502 0 1116.5 19.5" />
                  </svg>
                  Clique ou arraste um arquivo
                </label>
              ) : (
                <div className="p-3 bg-green-50 border-l-4 border-l-green-500 text-sm flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-green-700">✓ Arquivo selecionado</div>
                    <div className="text-green-600 text-xs mt-1">{file.name} • {(file.size / 1024).toFixed(2)} KB</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="ml-4 p-2 hover:bg-green-200 transition rounded text-green-700 flex-shrink-0"
                    title="Remover arquivo"
                    aria-label="Remover arquivo selecionado"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            */}

            <MetroButton 
              type="submit" 
              variant="warning" 
              className="w-full" 
              disabled={uploading || selectedMeses.length === 0}
            >
              {uploading ? 'Registrando...' : 'Registrar pagamento'}
            </MetroButton>

            {uploadMsg && (
              <div className={`text-sm font-semibold p-3 rounded ${uploadMsg.includes('Erro') ? 'bg-red-50 text-red-600 border-l-4 border-l-red-600' : 'bg-green-50 text-green-700 border-l-4 border-l-green-600'}`}>
                {uploadMsg}
              </div>
            )}
          </form>
        </SectionCard>

        {/* Histórico de Solicitações */}
        <SectionCard title="Histórico de Solicitações">
          {loading ? (
            <div className="flex flex-col gap-4">
              {[...Array(4)].map((_, i) => (
                <HistoryCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {Object.entries(
                pagamentos.reduce((acc, p) => {
                  if (!acc[p.receipt_url]) acc[p.receipt_url] = [];
                  acc[p.receipt_url].push(p);
                  return acc;
                }, {})
              )
                .sort((a, b) => {
                  const dateA = new Date(a[1][0].created_at);
                  const dateB = new Date(b[1][0].created_at);
                  return dateB - dateA;
                })
                .map(([receipt_url, group]) => {
                  const meses = group.map(p => p.month_ref).join(', ');
                  const valor = group.reduce((sum, p) => sum + Number(p.amount), 0).toFixed(2).replace('.', ',');
                  let status = 'aprovado';
                  if (group.some(p => p.status === 'rejected')) status = 'rejeitado';
                  else if (group.some(p => p.status === 'pending')) status = 'pendente';
                  const receiptLink = receipt_url ? supabase.storage.from('receipts').getPublicUrl(receipt_url).data.publicUrl : null;
                  
                  return (
                    <HistoryCard
                      key={receipt_url}
                      meses={meses}
                      valor={valor}
                      status={status}
                      receiptLink={receiptLink}
                      isExpanded={expandedHistory.has(receipt_url)}
                      onToggle={() => toggleExpandedHistory(receipt_url)}
                    />
                  );
                })}
            </div>
          )}
        </SectionCard>
        </div>
      </div>

    </div>
  );
}
