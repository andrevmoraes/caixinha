import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ShareTarget() {
  const navigate = useNavigate();

  useEffect(() => {
    if ('launchQueue' in window) {
      window.launchQueue.setConsumer(launchParams => {
        if (!launchParams.files.length) return;
        const file = launchParams.files[0];
        // Salva o arquivo em memória temporária (window) e navega para o dashboard
        window.sharedFile = file;
        navigate('/dashboard');
      });
    }
  }, [navigate]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <h2 className="text-xl font-bold mb-4">Processando arquivo compartilhado...</h2>
      <p>Redirecionando para o envio do comprovante.</p>
    </div>
  );
}
