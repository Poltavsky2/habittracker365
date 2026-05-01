import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, Habit } from './types';
import Onboarding from './components/Onboarding';
import MarathonDashboard from './components/MarathonDashboard';
import ProfileView from './components/ProfileView';
import { Layout, Copy, CheckCircle2 } from 'lucide-react';
import { storageService } from './storage';
import WebApp from '@twa-dev/sdk';

const generateAccessKey = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export default function App() {
  const [userKey, setUserKey] = useState<string | null>(localStorage.getItem('auth_key'));
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTelegramContext, setIsTelegramContext] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [authMode, setAuthMode] = useState<'welcome' | 'login' | 'register'>('welcome');
  const [inputKey, setInputKey] = useState('');
  const [inputName, setInputName] = useState('');
  const [error, setError] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');

  // Telegram Integration
  useEffect(() => {
    // Failsafe: force loading to false after 2 seconds if something hangs
    const failsafe = setTimeout(() => {
      setLoading(false);
    }, 2000);

    try {
      if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
        WebApp.ready();
        WebApp.expand();
        WebApp.setHeaderColor('#fafafa'); 
      }
      
      const isTG = WebApp.initData.length > 0 || (WebApp.initDataUnsafe && WebApp.initDataUnsafe.user);
      setIsTelegramContext(!!isTG);

      const tgUser = WebApp.initDataUnsafe?.user;
      if (tgUser && tgUser.id) {
        const tgKey = `TG_${tgUser.id}`;
        const userData = storageService.login(tgKey);
        
        if (userData) {
          localStorage.setItem('auth_key', tgKey);
          setUserKey(tgKey);
        } else {
          const initialName = tgUser.first_name || 'User';
          storageService.register(initialName, tgKey);
          localStorage.setItem('auth_key', tgKey);
          setUserKey(tgKey);
        }
        setLoading(false);
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error('Initial init failed', e);
      setLoading(false);
    }

    return () => clearTimeout(failsafe);
  }, []);

  // Back Button handling in Telegram
  useEffect(() => {
    if ((window as any).Telegram?.WebApp?.BackButton) {
      if (showProfile) {
        WebApp.BackButton.show();
        const offClick = WebApp.BackButton.onClick(() => setShowProfile(false));
        return () => {
          if (offClick && typeof offClick === 'function') offClick();
          WebApp.BackButton.hide();
        };
      } else {
        WebApp.BackButton.hide();
      }
    }
  }, [showProfile]);

  const refreshData = () => {
    if (userKey) {
      const userData = storageService.login(userKey);
      if (userData) {
        setProfile(userData.profile);
        setHabits(userData.habits);
      } else {
        handleLogout();
      }
    } else {
      setProfile(null);
      setHabits([]);
    }
  };

  useEffect(() => {
    if (userKey) {
      refreshData();
    }
  }, [userKey]);

  useEffect(() => {
    // If we're not in telegram and not loading, we're ready
    if (!isTelegramContext && !loading) {
      // ready
    }
  }, [isTelegramContext, loading]);

  const handleRegister = () => {
    if (!inputName.trim()) return;
    setLoading(true);
    setError('');
    const key = generateAccessKey();
    try {
      storageService.register(inputName, key);
      setGeneratedKey(key);
    } catch (err: any) {
      setError('Ошибка регистрации. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    if (inputKey.length !== 6) return;
    setLoading(true);
    setError('');
    const userData = storageService.login(inputKey);
    if (userData) {
      localStorage.setItem('auth_key', inputKey);
      setUserKey(inputKey);
    } else {
      setError('Неверный ключ. Проверьте правильность ввода.');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_key');
    setUserKey(null);
    setProfile(null);
    setHabits([]);
    setAuthMode('welcome');
  };

  const handleConfirmKey = () => {
    localStorage.setItem('auth_key', generatedKey);
    setUserKey(generatedKey);
    setGeneratedKey('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen font-sans bg-neutral-50 text-neutral-900">
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-2xl font-light tracking-widest text-neutral-400">365</motion.div>
      </div>
    );
  }

  if (!userKey || (generatedKey && !profile)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 font-sans bg-neutral-50">
        <AnimatePresence mode="wait">
          {generatedKey ? (
            <motion.div key="w4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full space-y-8 text-center px-4">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-neutral-100 space-y-8 transition-colors">
                <div className="space-y-4">
                  <h2 className="text-xl font-bold tracking-tight text-neutral-400 uppercase">Твой уникальный ключ:</h2>
                  <div className="relative group">
                    <p className="text-6xl font-black tracking-widest text-neutral-900 select-all font-mono py-4 px-2 bg-neutral-50 rounded-2xl border-2 border-neutral-100 transition-colors">
                      {generatedKey}
                    </p>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(generatedKey);
                        alert('Ключ скопирован!');
                      }}
                      className="absolute -top-2 -right-2 p-3 bg-neutral-900 text-white rounded-full shadow-lg hover:scale-110 transition-transform active:scale-95"
                    >
                      <Copy size={20} />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-orange-50 rounded-2xl text-orange-700 text-sm font-medium leading-relaxed transition-colors">
                    ⚠️ <strong>ОБЯЗАТЕЛЬНО СОХРАНИ ЭТОТ КЛЮЧ!</strong><br />
                    Без него ты не сможешь войти в свой аккаунт. Восстановление невозможно.
                  </div>
                  <button onClick={handleConfirmKey} className="w-full py-5 bg-neutral-900 text-neutral-50 rounded-2xl font-bold text-lg shadow-xl shadow-neutral-200 transition-all active:scale-95">
                    <CheckCircle2 className="inline-block mr-2" size={20} /> Я сохранил, начать марафон
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <>
              {authMode === 'welcome' && (
                <motion.div key="w1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-md w-full space-y-12 text-center px-4">
                  <div className="space-y-4">
                    <h1 className="text-7xl font-black tracking-tighter text-neutral-900 leading-none transition-colors">365</h1>
                    <div className="h-px w-12 bg-neutral-200 mx-auto transition-colors" />
                    <p className="text-neutral-500 font-bold tracking-[0.2em] uppercase text-sm transition-colors">Марафон привычек</p>
                  </div>
                  <div className="flex flex-col gap-4">
                    {!isTelegramContext ? (
                      <>
                        <button onClick={() => setAuthMode('register')} className="w-full py-5 bg-neutral-900 text-neutral-50 rounded-2xl font-black tracking-tight hover:bg-neutral-800 transition-all shadow-xl shadow-neutral-200 text-lg">🚀 Начать новый путь</button>
                        <button onClick={() => setAuthMode('login')} className="w-full py-5 border-2 border-neutral-200 text-neutral-900 rounded-2xl font-black tracking-tight transition-all text-lg bg-white hover:bg-neutral-50">У меня есть ключ</button>
                      </>
                    ) : (
                      <div className="animate-pulse space-y-4">
                        <div className="h-16 bg-neutral-200 rounded-2xl w-full" />
                        <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest">Авторизация в Telegram...</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {authMode === 'register' && (
                <motion.div key="w2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-md w-full space-y-8 px-4">
                  <div className="space-y-2">
                    <h2 className="text-4xl font-black tracking-tighter transition-colors">Начало.</h2>
                    <p className="text-neutral-500 font-medium tracking-tight transition-colors">Как к тебе обращаться?</p>
                  </div>
                  <input 
                    type="text" 
                    value={inputName} 
                    onChange={e => setInputName(e.target.value)} 
                    placeholder="Введи свое имя" 
                    className="w-full p-5 bg-white rounded-2xl border-2 border-neutral-100 focus:border-neutral-900 outline-none transition-all text-xl font-bold shadow-sm" 
                  />
                  {error && (
                    <div className="bg-red-50 border border-red-100 p-5 rounded-2xl transition-colors">
                      <p className="text-red-600 text-sm font-bold">{error}</p>
                    </div>
                  )}
                  <button 
                    onClick={handleRegister} 
                    className="w-full py-5 bg-neutral-900 text-neutral-50 rounded-2xl font-black text-lg disabled:opacity-50 shadow-xl shadow-neutral-200 transition-all active:scale-95"
                    disabled={loading}
                  >
                    {loading ? 'Создание...' : 'Сгенерировать ключ'}
                  </button>
                  <button onClick={() => setAuthMode('welcome')} className="w-full text-neutral-400 font-bold text-sm tracking-widest uppercase transition-colors hover:text-neutral-600">Назад</button>
                </motion.div>
              )}

              {authMode === 'login' && (
                <motion.div key="w3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-md w-full space-y-8 px-4">
                  <div className="space-y-2">
                    <h2 className="text-4xl font-black tracking-tighter transition-colors">Вход</h2>
                    <p className="text-neutral-500 font-medium tracking-tight transition-colors">Введи свой 6-значный ключ</p>
                  </div>
                  <input 
                    type="text" 
                    maxLength={6} 
                    value={inputKey} 
                    onChange={e => setInputKey(e.target.value.toUpperCase())} 
                    placeholder="XXXXXX" 
                    className="w-full p-6 bg-white rounded-3xl border-2 border-neutral-100 focus:border-neutral-900 outline-none transition-all text-5xl font-black text-center tracking-[0.3em] uppercase shadow-lg" 
                  />
                  {error && <p className="text-red-500 text-center font-bold text-sm bg-red-50 p-4 rounded-2xl border border-red-100 transition-colors">{error}</p>}
                  <button 
                    onClick={handleLogin} 
                    disabled={loading}
                    className="w-full py-5 bg-neutral-900 text-neutral-50 rounded-2xl font-black text-lg shadow-xl shadow-neutral-200 disabled:opacity-50 transition-all active:scale-95"
                  >
                    {loading ? 'Вход...' : 'Войти в систему'}
                  </button>
                  <button onClick={() => setAuthMode('welcome')} className="w-full text-neutral-400 font-bold text-sm tracking-widest uppercase transition-colors hover:text-neutral-600">Назад</button>
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (!profile) {
    return <Onboarding userId={userKey} userName={profile?.name || inputName} onComplete={(newProfile) => {
      storageService.updateProfile(userKey, newProfile);
      refreshData();
    }} />;
  }

  return (
    <div className="min-h-screen font-sans transition-colors duration-500 bg-neutral-50 text-neutral-900">
      <main className="max-w-md mx-auto min-h-screen flex flex-col pt-8 pb-32 px-6">
        <AnimatePresence mode="wait">
          {showProfile ? (
            <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ProfileView 
                profile={profile} 
                habits={habits} 
                onBack={() => setShowProfile(false)} 
                onLogout={handleLogout}
                userKey={userKey}
                onRefresh={refreshData}
              />
            </motion.div>
          ) : (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <MarathonDashboard 
                profile={profile} 
                habits={habits} 
                onOpenProfile={() => setShowProfile(true)} 
                userKey={userKey}
                onRefresh={refreshData}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-6 pointer-events-none">
          <div className="bg-neutral-900/90 backdrop-blur-md rounded-3xl p-2 flex justify-around pointer-events-auto shadow-2xl shadow-neutral-300">
            <button onClick={() => setShowProfile(false)} className={`flex-1 py-3 rounded-2xl transition-all ${!showProfile ? 'bg-neutral-50 text-neutral-900 shadow-lg' : 'text-neutral-500'}`}>
              <Layout className="mx-auto" size={24} />
            </button>
            <button onClick={() => setShowProfile(true)} className={`flex-1 py-3 rounded-2xl transition-all ${showProfile ? 'bg-neutral-50 text-neutral-900 shadow-lg' : 'text-neutral-500'}`}>
              <div className="flex flex-col items-center justify-center">
                <span className="font-black text-[10px] uppercase tracking-widest">LVL {profile.level}</span>
              </div>
            </button>
          </div>
        </nav>
      </main>
    </div>
  );
}
