import { useState } from 'react';

export default function Register({ onRegister, loading, error, onBack }) {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [localError, setLocalError] = useState('');
  const [showPin, setShowPin] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError('');
    
    if (!username) {
      setLocalError('Digite um nome de usuário.');
      return;
    }
    
    if (username.length < 3) {
      setLocalError('O nome precisa ter pelo menos 3 caracteres.');
      return;
    }
    
    if (pin.length !== 4) {
      setLocalError('O PIN precisa ter exatamente 4 dígitos.');
      return;
    }
    
    if (pin !== pinConfirm) {
      setLocalError('Os PINs não coincidem. Digite novamente.');
      return;
    }
    
    onRegister(username, pin);
  };

  const pinMatch = pin.length === 4 && pinConfirm.length === 4 && pin === pinConfirm;
  const pinMismatch = pin.length === 4 && pinConfirm.length === 4 && pin !== pinConfirm;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-cinza-claro)] px-2">
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded shadow-md w-full max-w-sm border-2 border-green-500">
        {/* Cabeçalho */}
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-bold text-green-700 tracking-wide mb-2">Criar Conta</h2>
          <p className="text-sm text-gray-600">Cadastre-se para acessar a caixinha</p>
        </div>

        {/* Campo Nome */}
        <div className="mb-5">
          <label className="block mb-2 text-sm font-semibold text-gray-700">
            Escolha seu nome de usuário
          </label>
          <input
            type="text"
            className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Ex: João Silva"
            autoFocus
          />
          <p className="text-xs text-gray-500 mt-1">
            Como você quer ser chamado (mínimo 3 caracteres)
          </p>
        </div>

        {/* Campo PIN */}
        <div className="mb-5">
          <label className="block mb-2 text-sm font-semibold text-gray-700">
            Crie um PIN (sua senha de 4 dígitos)
          </label>
          <div className="relative">
            <input
              type={showPin ? "text" : "password"}
              className={`w-full border-2 rounded-lg px-3 py-2 pr-12 focus:outline-none transition ${
                pin.length === 4 ? 'border-green-500 bg-green-50' : 'border-gray-300'
              } focus:border-green-500 focus:ring-2 focus:ring-green-200`}
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              maxLength={4}
              inputMode="numeric"
              placeholder="0000"
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-xs px-2 py-1"
              tabIndex={-1}
            >
              {showPin ? '🙈' : '👁️'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            🔐 Escolha 4 números que você não vai esquecer
          </p>
        </div>

        {/* Confirmação de PIN */}
        <div className="mb-5">
          <label className="block mb-2 text-sm font-semibold text-gray-700">
            Confirme seu PIN
          </label>
          <div className="relative">
            <input
              type={showPin ? "text" : "password"}
              className={`w-full border-2 rounded-lg px-3 py-2 pr-10 focus:outline-none transition ${
                pinMatch ? 'border-green-500 bg-green-50' :
                pinMismatch ? 'border-red-500 bg-red-50' :
                'border-gray-300'
              } focus:border-green-500 focus:ring-2 focus:ring-green-200`}
              value={pinConfirm}
              onChange={e => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
              maxLength={4}
              inputMode="numeric"
              placeholder="0000"
            />
            {pinMatch && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600">✓</span>
            )}
            {pinMismatch && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600">✗</span>
            )}
          </div>
          {pinMatch && (
            <p className="text-xs text-green-600 mt-1">✓ PINs coincidem!</p>
          )}
          {pinMismatch && (
            <p className="text-xs text-red-600 mt-1">✗ PINs diferentes</p>
          )}
        </div>

        {/* Mensagens de erro */}
        {(localError || error) && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-3 py-2 rounded-lg text-sm mb-4">
            {localError || error}
          </div>
        )}

        {/* Botão de cadastrar */}
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed mb-4 shadow-md"
          disabled={loading}
        >
          {loading ? '⏳ Cadastrando...' : '✨ Criar minha conta'}
        </button>

        {/* Divisor */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-white text-gray-500">Já tem conta?</span>
          </div>
        </div>

        {/* Link para login */}
        <button
          type="button"
          className="w-full border-2 border-green-600 text-green-600 py-2 rounded-lg font-bold hover:bg-green-50 transition"
          onClick={onBack}
          disabled={loading}
        >
          Fazer login
        </button>
      </form>
    </div>
  );
}
