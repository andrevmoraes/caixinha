import { useState } from 'react';
import MetroButton from './MetroButton';
import { LABELS, PLACEHOLDERS, HELPERS, BUTTON_LABELS, ARIA_LABELS } from '../constants';

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
    <div className="flex flex-1 items-center justify-center bg-gray-100 px-4 py-6">
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 w-full max-w-sm border-l-4 border-l-green-600">
        {/* Cabeçalho */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-green-700 tracking-wide mb-1 sm:mb-2">Criar Conta</h2>
          <p className="text-xs sm:text-sm text-gray-600">Cadastre-se para acessar a caixinha</p>
        </div>

        {/* Campo Nome */}
        <div className="mb-6">
          <label className="block mb-2 text-xs font-semibold text-gray-700 uppercase tracking-wide">
            Escolha seu nome de usuário
          </label>
          <input
            type="text"
            className="w-full bg-gray-50 border-b border-gray-300 px-3 py-2 text-sm focus:outline-none focus:bg-white focus:border-b-2 focus:border-green-600 transition"
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
        <div className="mb-6">
          <label className="block mb-2 text-xs font-semibold text-gray-700 uppercase tracking-wide">
            Crie um PIN (sua senha de 4 dígitos)
          </label>
          <div className="relative">
            <input
              type={showPin ? "text" : "password"}
              className={`w-full bg-gray-50 border-b px-3 py-2 pr-10 text-sm focus:outline-none transition ${
                pin.length === 4 ? 'border-b-green-600 focus:border-b-2 bg-green-50' : 'border-b-gray-300 focus:border-b-2 focus:border-b-green-600'
              } focus:bg-white`}
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              maxLength={4}
              inputMode="numeric"
              placeholder="0000"
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm"
              tabIndex={-1}
              aria-label={showPin ? 'Ocultar PIN' : 'Mostrar PIN'}
            >
              {showPin ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Escolha 4 números que você não vai esquecer
          </p>
        </div>

        {/* Confirmação de PIN */}
        <div className="mb-6">
          <label className="block mb-2 text-xs font-semibold text-gray-700 uppercase tracking-wide">
            Confirme seu PIN
          </label>
          <div className="relative">
            <input
              type={showPin ? "text" : "password"}
              className={`w-full bg-gray-50 border-b px-3 py-2 pr-10 text-sm focus:outline-none transition ${
                pinMatch ? 'border-b-green-600 focus:border-b-2 bg-green-50' :
                pinMismatch ? 'border-b-red-600 focus:border-b-2 bg-red-50' :
                'border-b-gray-300 focus:border-b-2 focus:border-b-green-600'
              } focus:bg-white`}
              value={pinConfirm}
              onChange={e => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
              maxLength={4}
              inputMode="numeric"
              placeholder="0000"
            />
            {pinMatch && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 font-bold">✓</span>
            )}
            {pinMismatch && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600 font-bold">✗</span>
            )}
          </div>
          {pinMatch && (
            <p className="text-xs text-green-600 mt-1">PINs coincidem!</p>
          )}
          {pinMismatch && (
            <p className="text-xs text-red-600 mt-1">PINs diferentes</p>
          )}
        </div>

        {/* Mensagens de erro */}
        {(localError || error) && (
          <div className="bg-red-50 border-l-4 border-l-red-600 text-red-700 px-3 py-2 text-sm mb-6">
            {localError || error}
          </div>
        )}

        {/* Botão de cadastrar */}
        <MetroButton
          type="submit"
          variant="success"
          className="w-full !py-3 mb-4"
          disabled={loading}
        >
          {loading ? 'cadastrando...' : 'criar conta'}
        </MetroButton>

        {/* Divisor */}
        <div className="relative my-6">
          <div className="h-px bg-gray-300"></div>
          <div className="absolute inset-0 flex justify-center">
            <span className="px-2 bg-white text-xs text-gray-500">ou</span>
          </div>
        </div>

        {/* Link para login */}
        <MetroButton
          type="button"
          variant="success"
          className="w-full !py-3 !bg-green-50 !text-green-600 !border-l-green-600 !hover:bg-green-100"
          onClick={onBack}
          disabled={loading}
        >
          fazer login
        </MetroButton>
      </form>
    </div>
  );
}
