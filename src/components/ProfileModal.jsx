import { useState } from 'react';

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
    if (ok) setMsg('Dados atualizados!');
    else setMsg('Erro ao atualizar.');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg p-6 w-full max-w-xs relative">
        <button className="absolute top-2 right-2 text-gray-500 hover:text-black" onClick={onClose}>&times;</button>
        <h2 className="text-xl font-bold mb-4 text-[var(--color-marinho-itau)]">Perfil</h2>
        <form onSubmit={handleUpdate} className="flex flex-col gap-3">
          <label className="text-sm font-medium">Usuário</label>
          <input type="text" className="border rounded px-3 py-2" value={username} onChange={e => setUsername(e.target.value)} />
          <label className="text-sm font-medium">PIN (4 dígitos)</label>
          <input type="password" className="border rounded px-3 py-2" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} maxLength={4} inputMode="numeric" />
          {msg && <div className="text-green-700 text-sm">{msg}</div>}
          <button type="submit" className="bg-[var(--color-laranja-itau)] text-white py-2 rounded font-semibold hover:bg-orange-700 transition" disabled={loading}>{loading ? 'Salvando...' : 'Salvar alterações'}</button>
        </form>
        <button className="mt-4 w-full border border-[var(--color-laranja-itau)] text-[var(--color-laranja-itau)] py-2 rounded font-semibold hover:bg-orange-50 transition" onClick={onLogout}>Sair da conta</button>
      </div>
    </div>
  );
}
