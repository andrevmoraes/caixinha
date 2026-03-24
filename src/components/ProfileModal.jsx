import { useState } from 'react';
import MetroButton from './MetroButton';
import { BUTTON_LABELS, SUCCESS_MESSAGES } from '../constants';

export default function ProfileModal({ user, onClose, onLogout, onUpdate }) {
  const [username, setUsername] = useState(user.username);
  const [pin, setPin] = useState(user.pin);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    const ok = await onUpdate(username, pin);
    setLoading(false);
    if (ok) setMsg(SUCCESS_MESSAGES.profileUpdated);
    else setMsg('Erro ao atualizar.');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 w-full max-w-xs relative border-l-4 border-l-[var(--color-marinho-itau)]">
        <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none" onClick={onClose}>×</button>
        <h2 className="text-2xl font-bold mb-6 text-[var(--color-marinho-itau)]">Perfil</h2>
        <form onSubmit={handleUpdate} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 block">Usuário</label>
            <input type="text" className="w-full bg-gray-50 border-b border-gray-300 px-3 py-2 text-sm focus:outline-none focus:bg-white focus:border-b-2 focus:border-[var(--color-laranja-itau)]" value={username} onChange={e => setUsername(e.target.value)} aria-label="Nome de usuário" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 block">PIN (4 dígitos)</label>
            <input type="password" className="w-full bg-gray-50 border-b border-gray-300 px-3 py-2 text-sm focus:outline-none focus:bg-white focus:border-b-2 focus:border-[var(--color-laranja-itau)]" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} maxLength={4} inputMode="numeric" aria-label="PIN" />
          </div>
          {msg && <div className={`text-sm font-semibold ${msg.includes('sucesso') ? 'text-green-700' : 'text-red-700'}`}>{msg}</div>}
          <MetroButton type="submit" variant="secondary" className="mt-2 w-full" disabled={loading}>{loading ? 'Salvando...' : BUTTON_LABELS.save}</MetroButton>
        </form>
        <MetroButton variant="secondary" className="mt-4 w-full" onClick={onLogout}>{BUTTON_LABELS.logout}</MetroButton>
      </div>
    </div>
  );
}
