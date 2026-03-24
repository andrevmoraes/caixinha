import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import { supabase } from './lib/supabaseClient';
import { validateUsername, validatePin } from './lib/validation';
import UserDashboard from './components/UserDashboard';
import AdminPanel from './components/AdminPanel';
import Header from './components/Header';
import Settings from './components/Settings';
import ShareTarget from './components/ShareTarget';

function App() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const navigate = useNavigate();

  // Carrega usuário do localStorage ao montar o componente
  useEffect(() => {
    console.log('🚀 [APP] Iniciando aplicação...');
    const savedUser = localStorage.getItem('caixinha_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      console.log('👤 [APP] Usuário encontrado no localStorage:', userData.username, 'id:', userData.id);
      setUser(userData);
      // Reconfigura o RLS context para o usuário carregado
      console.log('🔧 [APP] Reconfigurando RLS para usuário do localStorage:', userData.id);
      supabase.rpc('set_current_user_id', { user_id: userData.id }).then(({ data, error }) => {
        if (error) {
          console.error('❌ [APP] Erro ao reconfigurar RLS:', error);
        } else {
          console.log('✅ [APP] RLS reconfigurado com sucesso - data:', data);
        }
      });
    } else {
      console.log('👤 [APP] Nenhum usuário no localStorage');
    }
  }, []);

  const handleLogin = async (username, pin) => {
    setLoading(true);
    setLoginError('');
    
    console.log('🔐 [LOGIN] Iniciando login...');
    
    // Validação
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      console.log('❌ [LOGIN] Validação de username falhou:', usernameValidation.error);
      setLoginError(usernameValidation.error);
      setLoading(false);
      return;
    }

    const pinValidation = validatePin(pin);
    if (!pinValidation.valid) {
      console.log('❌ [LOGIN] Validação de PIN falhou:', pinValidation.error);
      setLoginError(pinValidation.error);
      setLoading(false);
      return;
    }

    console.log('✅ [LOGIN] Validações passaram. Autenticando via RPC no Supabase...');
    console.log('🔍 [LOGIN] Buscando username:', usernameValidation.sanitized, 'pin:', pinValidation.sanitized);

    const { data, error } = await supabase.rpc('authenticate_user', {
      p_username: usernameValidation.sanitized,
      p_pin: pinValidation.sanitized
    });

    const userData = Array.isArray(data) ? data[0] : data;
    console.log('📊 [LOGIN] Resultado da RPC - data:', userData, 'error:', error, 'rawDataLength:', Array.isArray(data) ? data.length : null);
    
    if (error) {
      console.error('❌ [LOGIN] Erro do Supabase:', error);
      if (error.code === 'PGRST202') {
        setLoginError('Função de login não encontrada no banco. Verifique a configuração do RPC no Supabase.');
      } else {
        setLoginError('Erro ao conectar. Verifique a configuração do Supabase.');
      }
      setLoading(false);
      return;
    }
    
    if (!userData) {
      console.log('❌ [LOGIN] Nenhum usuário encontrado (credenciais inválidas ou usuário inexistente)');
      setLoginError('Usuário ou PIN inválido.');
      setLoading(false);
      return;
    }
    
    console.log('✅ [LOGIN] Usuário encontrado:', userData.username, 'id:', userData.id, 'is_admin:', userData.is_admin);
    console.log('🔧 [LOGIN] Configurando current_user_id para RLS...');
    
    // Configurar user_id para RLS
    const { data: rlsData, error: rpcError } = await supabase.rpc('set_current_user_id', { user_id: userData.id });
    
    if (rpcError) {
      console.error('❌ [LOGIN] Erro ao configurar RLS:', rpcError);
    } else {
      console.log('✅ [LOGIN] RLS configurado com sucesso - data:', rlsData);
    }
    
    setUser(userData);
    localStorage.setItem('caixinha_user', JSON.stringify(userData));
    setLoading(false);
    
    console.log('🎉 [LOGIN] Login completo! Redirecionando...');
    
    if (userData.is_admin) {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  const handleRegister = async (username, pin) => {
    setLoading(true);
    setRegisterError('');
    
    // Validação
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      setRegisterError(usernameValidation.error);
      setLoading(false);
      return;
    }

    const pinValidation = validatePin(pin);
    if (!pinValidation.valid) {
      setRegisterError(pinValidation.error);
      setLoading(false);
      return;
    }

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', usernameValidation.sanitized)
      .single();
    if (existing) {
      setRegisterError('Nome de usuário já existe.');
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('profiles')
      .insert({ username: usernameValidation.sanitized, pin: pinValidation.sanitized })
      .select()
      .single();
    setLoading(false);
    if (error || !data) {
      console.error('❌ [REGISTER] Erro ao cadastrar:', error);
      setRegisterError('Erro ao cadastrar. Tente outro nome.');
      return;
    }
    
    console.log('✅ [REGISTER] Usuário cadastrado:', data.username, 'id:', data.id);
    console.log('🔧 [REGISTER] Configurando RLS...');
    
    // Configurar user_id para RLS
    const { data: rlsData, error: rlsError } = await supabase.rpc('set_current_user_id', { user_id: data.id });
    
    if (rlsError) {
      console.error('❌ [REGISTER] Erro ao configurar RLS:', rlsError);
    } else {
      console.log('✅ [REGISTER] RLS configurado com sucesso - data:', rlsData);
    }
    
    setUser(data);
    localStorage.setItem('caixinha_user', JSON.stringify(data));
    console.log('🎉 [REGISTER] Cadastro completo! Redirecionando...');
    navigate('/dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('caixinha_user');
    navigate('/');
  };

  const handleUpdateProfile = async (username, pin) => {
    if (!user) return false;
    
    // Validação
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return false;
    }

    const pinValidation = validatePin(pin);
    if (!pinValidation.valid) {
      return false;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ username: usernameValidation.sanitized, pin: pinValidation.sanitized })
      .eq('id', user.id);
    if (!error) {
      const updatedUser = { ...user, username: usernameValidation.sanitized, pin: pinValidation.sanitized };
      setUser(updatedUser);
      localStorage.setItem('caixinha_user', JSON.stringify(updatedUser));
    }
    return !error;
  };

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      <Header user={user} onProfileClick={() => navigate('/settings')} />
      <div className="flex-1 flex">
        <Routes>
        <Route
          path="/"
          element={
            !user ? (
              <Register
                onRegister={handleRegister}
                loading={loading}
                error={registerError}
                onBack={() => navigate('/login')}
              />
            ) : (
              <Navigate to={user.is_admin ? '/admin' : '/dashboard'} />
            )
          }
        />
        <Route
          path="/login"
          element={
            !user ? (
              <Login
                onLogin={handleLogin}
                loading={loading}
                error={loginError}
                onRegisterClick={() => navigate('/')}
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
        <Route
          path="/settings"
          element={
            user ? (
              <Settings
                user={user}
                onLogout={handleLogout}
                onUpdate={handleUpdateProfile}
              />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route path="/share-target" element={<ShareTarget />} />
        <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
