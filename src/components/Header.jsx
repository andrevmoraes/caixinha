import { useNavigate, useLocation } from 'react-router-dom';

export default function Header({ user, onProfileClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user && user.is_admin;
  const isOnAdmin = location.pathname === '/admin';
  const isOnDashboard = location.pathname === '/dashboard';

  return (
    <header className="w-full flex items-center justify-between px-4 py-3 bg-[var(--color-marinho-itau)] text-white shadow">
      <h1 className="text-lg sm:text-2xl font-bold tracking-wide">Caixinha</h1>
      <div className="flex items-center gap-2">
        {isAdmin && (
          <button
            className="bg-white text-[var(--color-marinho-itau)] font-semibold rounded px-3 py-1 shadow hover:bg-gray-100 transition border border-[var(--color-laranja-itau)]"
            onClick={() => navigate(isOnAdmin ? '/dashboard' : '/admin')}
          >
            {isOnAdmin ? 'Meu Dashboard' : 'Painel Admin'}
          </button>
        )}
        {user && (
          <button
            className="flex items-center gap-2 bg-[var(--color-laranja-itau)] hover:bg-orange-700 transition px-3 py-1 rounded font-semibold text-white"
            onClick={onProfileClick}
          >
            <span className="hidden sm:inline">Perfil</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 1115 0v.75a.75.75 0 01-.75.75h-13.5a.75.75 0 01-.75-.75v-.75z" />
            </svg>
          </button>
        )}
      </div>
    </header>
  );
}
