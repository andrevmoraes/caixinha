import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import { supabase } from './lib/supabaseClient';
import UserDashboard from './components/UserDashboard';
import AdminPanel from './components/AdminPanel';
import Header from './components/Header';
import ProfileModal from './components/ProfileModal';
import ShareTarget from './components/ShareTarget';

function App() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();

  // Carrega usuário do localStorage ao montar o componente
  useEffect(() => {
    const savedUser = localStorage.getItem('caixinha_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = async (username, pin) => {
    setLoading(true);
    setLoginError('');
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .eq('pin', pin)
      .single();
    setLoading(false);
    if (error || !data) {
      setLoginError('Usuário ou PIN inválido.');
      return;
    }
    setUser(data);
    localStorage.setItem('caixinha_user', JSON.stringify(data));
    if (data.is_admin) {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  const handleRegister = async (username, pin) => {
    setLoading(true);
    setRegisterError('');
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();
    if (existing) {
      setRegisterError('Nome de usuário já existe.');
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('profiles')
      .insert({ username, pin })
      .select()
      .single();
    setLoading(false);
    if (error || !data) {
      setRegisterError('Erro ao cadastrar. Tente outro nome.');
      return;
    }
    setUser(data);
    localStorage.setItem('caixinha_user', JSON.stringify(data));
    navigate('/dashboard');
  };

  const handleLogout = () => {
    setShowProfile(false);
    setUser(null);
    localStorage.removeItem('caixinha_user');
    navigate('/');
  };

  const handleUpdateProfile = async (username, pin) => {
    if (!user) return false;
    const { error } = await supabase
      .from('profiles')
      .update({ username, pin })
      .eq('id', user.id);
    if (!error) {
      const updatedUser = { ...user, username, pin };
      setUser(updatedUser);
      localStorage.setItem('caixinha_user', JSON.stringify(updatedUser));
    }
    return !error;
  };

  return (
    <>
      <Header user={user} onProfileClick={() => setShowProfile(true)} />
      {showProfile && user && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onLogout={handleLogout}
          onUpdate={handleUpdateProfile}
        />
      )}
      <Routes>
        <Route
          path="/"
          element={
            !user ? (
              <Login
                onLogin={handleLogin}
                loading={loading}
                error={loginError}
                onRegisterClick={() => navigate('/register')}
              />
            ) : (
              <Navigate to={user.is_admin ? '/admin' : '/dashboard'} />
            )
          }
        />
        <Route
          path="/register"
          element={
            !user ? (
              <Register
                onRegister={handleRegister}
                loading={loading}
                error={registerError}
                onBack={() => navigate('/')}
              />
            ) : (
              <Navigate to={user.is_admin ? '/admin' : '/dashboard'} />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            user ? (
              <UserDashboard user={user} />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/admin"
          element={
            user && user.is_admin ? (
              <AdminPanel user={user} />
            ) : (
              <Navigate to={user ? '/dashboard' : '/'} />
            )
          }
        />
        <Route path="/share-target" element={<ShareTarget />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;
