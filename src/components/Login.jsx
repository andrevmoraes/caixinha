import { useState } from 'react';
import MetroButton from './MetroButton';
import LoginSkeleton from './LoginSkeleton';
import { LABELS, PLACEHOLDERS, HELPERS, BUTTON_LABELS, ARIA_LABELS } from '../constants';

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
    <>
      {loading ? (
        <LoginSkeleton />
      ) : (
        <div className="flex flex-1 items-center justify-center bg-gray-100 px-4 py-6">
          <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 w-full max-w-sm border-l-4 border-l-[var(--color-marinho-itau)]">
            {/* Cabeçalho */}
            <div className="mb-6 sm:mb-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-marinho-itau)] tracking-wide mb-1 sm:mb-2">Entrar</h2>
              <p className="text-xs sm:text-sm text-gray-600">Acesse sua conta da caixinha</p>
            </div>

            {/* Campo Nome */}
            <div className="mb-6">
              <label className="block mb-2 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                {LABELS.username}
              </label>
              <input
                type="text"
                className="w-full bg-gray-50 border-b border-gray-300 px-3 py-2 text-sm focus:outline-none focus:bg-white focus:border-b-2 focus:border-[var(--color-laranja-itau)] transition"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder={PLACEHOLDERS.username}
                autoFocus
                aria-label={LABELS.username}
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">{HELPERS.usernameLogin}</p>
            </div>

            {/* Campo PIN */}
            <div className="mb-6">
              <label className="block mb-2 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                {LABELS.pin}
              </label>
              <div className="relative">
                <input
                  type={showPin ? "text" : "password"}
                  className="w-full bg-gray-50 border-b border-gray-300 px-3 py-2 pr-10 text-sm focus:outline-none focus:bg-white focus:border-b-2 focus:border-[var(--color-laranja-itau)] transition"
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  inputMode="numeric"
                  placeholder={PLACEHOLDERS.pin}
                  aria-label={LABELS.pin}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm"
                  tabIndex={-1}
                  aria-label={showPin ? ARIA_LABELS.togglePin.hide : ARIA_LABELS.togglePin.show}
                  disabled={loading}
                >
                  {showPin ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">{HELPERS.pinLogin}</p>
            </div>

            {/* Mensagens de erro */}
            {(localError || error) && (
              <div className="bg-red-50 border-l-4 border-l-red-600 text-red-700 px-3 py-2 text-sm mb-6">
                {localError || error}
              </div>
            )}

            {/* Botão de entrar */}
            <MetroButton
              type="submit"
              variant="primary"
              className="w-full !py-3 mb-4"
              disabled={loading}
            >
              {loading ? 'entrando...' : 'entrar'}
            </MetroButton>

            {/* Divisor */}
            <div className="relative my-6">
              <div className="h-px bg-gray-300"></div>
              <div className="absolute inset-0 flex justify-center">
                <span className="px-2 bg-white text-xs text-gray-500">ou</span>
              </div>
            </div>

            {/* Link para cadastro */}
            <MetroButton
              type="button"
              variant="success"
              className="w-full !py-3"
              onClick={onRegisterClick}
              disabled={loading}
            >
              criar conta
            </MetroButton>
          </form>
        </div>
      )}
    </>
  );
}
