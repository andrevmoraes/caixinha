import { useState } from 'react';

export default function Register({ onRegister, loading, error, onBack }) {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError('');
    if (!username || pin.length !== 4) {
      setLocalError('Preencha o usuário e um PIN de 4 dígitos.');
      return;
    }
    onRegister(username, pin);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-cinza-claro)] px-2">
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded shadow-md w-full max-w-xs border border-[var(--color-laranja-itau)]">
        <h2 className="text-2xl font-bold mb-6 text-center text-[var(--color-marinho-itau)] tracking-wide">Cadastrar</h2>
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium">Usuário</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-laranja-itau)]"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoFocus
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium">PIN (4 dígitos)</label>
          <input
            type="password"
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-laranja-itau)]"
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            maxLength={4}
            inputMode="numeric"
          />
        </div>
        {(localError || error) && <div className="text-red-600 text-sm mb-2">{localError || error}</div>}
        <button
          type="submit"
          className="w-full bg-[var(--color-laranja-itau)] text-white py-2 rounded font-semibold hover:bg-orange-700 transition mb-2"
          disabled={loading}
        >
          {loading ? 'Cadastrando...' : 'Cadastrar'}
        </button>
        <button
          type="button"
          className="w-full border border-[var(--color-laranja-itau)] text-[var(--color-laranja-itau)] py-2 rounded font-semibold hover:bg-orange-50 transition"
          onClick={onBack}
          disabled={loading}
        >
          Voltar para login
        </button>
      </form>
    </div>
  );
}
