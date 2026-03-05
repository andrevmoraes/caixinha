import { useState } from 'react';

export default function Login({ onLogin, loading, error, onRegisterClick }) {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [localError, setLocalError] = useState('');
  const [showPin, setShowPin] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError('');
    if (!username || pin.length !== 4) {
      setLocalError('Preencha o usuário e um PIN de 4 dígitos.');
      return;
    }
    onLogin(username, pin);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-cinza-claro)] px-2">
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded shadow-md w-full max-w-sm border-2 border-[var(--color-laranja-itau)]">
        {/* Cabeçalho */}
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-bold text-[var(--color-marinho-itau)] tracking-wide mb-2">Entrar</h2>
          <p className="text-sm text-gray-600">Acesse sua conta da caixinha</p>
        </div>

        {/* Campo Nome */}
        <div className="mb-5">
          <label className="block mb-2 text-sm font-semibold text-[var(--color-marinho-itau)]">
            Nome de usuário
          </label>
          <input
            type="text"
            className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-laranja-itau)] focus:ring-2 focus:ring-orange-200 transition"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Digite seu nome"
            autoFocus
          />
          <p className="text-xs text-gray-500 mt-1">O nome que você usou no cadastro</p>
        </div>

        {/* Campo PIN */}
        <div className="mb-5">
          <label className="block mb-2 text-sm font-semibold text-[var(--color-marinho-itau)]">
            PIN (sua senha de 4 dígitos)
          </label>
          <div className="relative">
            <input
              type={showPin ? "text" : "password"}
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 pr-12 focus:outline-none focus:border-[var(--color-laranja-itau)] focus:ring-2 focus:ring-orange-200 transition"
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
          <p className="text-xs text-gray-500 mt-1">Sua senha secreta de 4 números</p>
        </div>

        {/* Mensagens de erro */}
        {(localError || error) && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-3 py-2 rounded-lg text-sm mb-4">
            {localError || error}
          </div>
        )}

        {/* Botão de entrar */}
        <button
          type="submit"
          className="w-full bg-[var(--color-laranja-itau)] text-white py-3 rounded-lg font-bold hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed mb-4 shadow-md"
          disabled={loading}
        >
          {loading ? '⏳ Entrando...' : '🔓 Entrar'}
        </button>

        {/* Divisor */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-white text-gray-500">Não tem conta?</span>
          </div>
        </div>

        {/* Link para cadastro */}
        <button
          type="button"
          className="w-full border-2 border-[var(--color-laranja-itau)] text-[var(--color-laranja-itau)] py-2 rounded-lg font-bold hover:bg-orange-50 transition"
          onClick={onRegisterClick}
          disabled={loading}
        >
          Criar nova conta
        </button>
      </form>
    </div>
  );
}
