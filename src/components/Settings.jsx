import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MetroButton from './MetroButton';
import { BUTTON_LABELS, SUCCESS_MESSAGES } from '../constants';

export default function Settings({ user, onLogout, onUpdate }) {
  const [username, setUsername] = useState(user.username);
  const [pin, setPin] = useState(user.pin);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    const ok = await onUpdate(username, pin);
    setLoading(false);
    if (ok) setMsg(SUCCESS_MESSAGES.profileUpdated);
    else setMsg('Erro ao atualizar.');
  };

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="max-w-4xl mx-auto w-full px-4 py-6">
        <h2 className="text-3xl font-bold mb-6 text-[var(--color-marinho-itau)]">Configurações</h2>
        
        <div className="bg-white border-l-4 border-l-[var(--color-marinho-itau)] p-6 shadow-sm">
          <form onSubmit={handleUpdate} className="flex flex-col gap-4 max-w-md">
            <div>
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 block">Usuário</label>
              <input 
                type="text" 
                className="w-full bg-gray-50 border-b border-gray-300 px-3 py-2 text-sm focus:outline-none focus:bg-white focus:border-b-2 focus:border-[var(--color-laranja-itau)]" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                aria-label="Nome de usuário" 
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 block">PIN (4 dígitos)</label>
              <input 
                type="password" 
                className="w-full bg-gray-50 border-b border-gray-300 px-3 py-2 text-sm focus:outline-none focus:bg-white focus:border-b-2 focus:border-[var(--color-laranja-itau)]" 
                value={pin} 
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} 
                maxLength={4} 
                inputMode="numeric" 
                aria-label="PIN" 
              />
            </div>
            {msg && <div className={`text-sm font-semibold ${msg.includes('sucesso') ? 'text-green-700' : 'text-red-700'}`}>{msg}</div>}
            <div className="flex gap-2 mt-4">
              <MetroButton type="submit" variant="secondary" className="flex-1" disabled={loading}>
                {loading ? 'Salvando...' : BUTTON_LABELS.save}
              </MetroButton>
              <MetroButton type="button" variant="secondary" onClick={() => navigate(-1)}>
                Voltar
              </MetroButton>
            </div>
          </form>
          
          <div className="border-t border-gray-200 mt-8 pt-6">
            <h3 className="text-lg font-bold mb-4 text-[var(--color-marinho-itau)]">Logout</h3>
            <MetroButton variant="secondary" className="w-full max-w-md" onClick={handleLogout}>
              {BUTTON_LABELS.logout}
            </MetroButton>
          </div>
        </div>
      </div>
    </div>
  );
}
