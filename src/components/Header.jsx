import { useNavigate, useLocation } from 'react-router-dom';
import MetroButton from './MetroButton';

export default function Header({ user, onProfileClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user && user.is_admin;
  const isOnAdmin = location.pathname === '/admin';

  return (
    <header className="w-full bg-[var(--color-marinho-itau)] text-white border-b-4 overflow-x-hidden" style={{ borderBottomColor: 'var(--color-laranja-itau)' }}>
      <div className="max-w-4xl mx-auto px-4 py-6 w-full">
        {/* Horizontal: Logo à esquerda, botões à direita */}
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">Caixinha</h1>

          {/* Botões de ação - sempre à direita */}
          <div className="flex items-center justify-end gap-2 flex-wrap">
            {isAdmin && (
              <MetroButton
                variant="warning"
                size="sm"
                onClick={() => navigate(isOnAdmin ? '/dashboard' : '/admin')}
              >
                {isOnAdmin ? 'dashboard' : 'admin'}
              </MetroButton>
            )}
            {user && (
              <MetroButton
                variant="warning"
                size="sm"
                onClick={onProfileClick}
              >
                perfil
              </MetroButton>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
