import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock } from 'lucide-react';
import { loginApi, registerApi } from '@api/auth';
import { clearStorageCache, initStorageFromServer } from '@api/storage';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export const LoginPrompt: React.FC<{ message?: string }> = ({ message }) => {
  const { login } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [inviteKey, setInviteKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setInviteKey('');
    setError(null);
  };

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password.trim()) return;

    setLoading(true);
    try {
      // 清除旧用户缓存，防止新用户看到前用户的数据
      clearStorageCache();
      if (mode === 'login') {
        const user = await loginApi(username, password);
        login(user);
      } else {
        if (!inviteKey.trim()) {
          setError(t('auth.registerFailed'));
          setLoading(false);
          return;
        }
        const user = await registerApi(username, password, inviteKey);
        login(user);
      }
      // 从服务器拉取当前用户数据
      initStorageFromServer();
    } catch (err: any) {
      setError(err.message || (mode === 'login' ? t('auth.loginFailed') : t('auth.registerFailed')));
    } finally {
      setLoading(false);
    }
  };

  const isLogin = mode === 'login';

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-md mx-auto w-full min-h-[60vh]">
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-[#EAEAE0] w-full text-center">
        <div className="w-16 h-16 bg-[#F5F5F0] rounded-full flex items-center justify-center mx-auto mb-6 text-[#5A5A40]">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-[#5A5A40] mb-2">
          {isLogin ? t('auth.authentication') : t('auth.register')}
        </h2>
        <p className="text-[#848464] mb-8 text-sm md:text-base">
          {message || (isLogin ? t('messages.loginHistory') : '')}
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-6 text-left border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-sm font-bold text-[#5A5A40] mb-1">
              {t('auth.username')}
            </label>
            <input
              type="text"
              required
              className="w-full border border-[#E0E0D5] bg-[#F5F5F0] rounded-xl px-4 py-3 outline-none focus:border-[#D48166] transition-colors"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder={t('auth.enterUsername')}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#5A5A40] mb-1">
              {t('auth.password')}
            </label>
            <input
              type="password"
              required
              className="w-full border border-[#E0E0D5] bg-[#F5F5F0] rounded-xl px-4 py-3 outline-none focus:border-[#D48166] transition-colors"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t('auth.enterPassword')}
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-bold text-[#5A5A40] mb-1">
                {t('auth.inviteKey')}
              </label>
              <input
                type="text"
                required
                className="w-full border border-[#E0E0D5] bg-[#F5F5F0] rounded-xl px-4 py-3 outline-none focus:border-[#D48166] transition-colors"
                value={inviteKey}
                onChange={e => setInviteKey(e.target.value)}
                placeholder={t('auth.enterInviteKey')}
              />
              <p className="text-xs text-center mt-2">
                <button
                  type="button"
                  onClick={() => navigate('/get-key')}
                  className="text-[#D48166] hover:underline cursor-pointer"
                >
                  {t('auth.getKey')}
                </button>
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#D48166] text-white font-bold rounded-xl py-3 mt-2 hover:bg-[#C27055] transition-colors disabled:opacity-50"
          >
            {loading
              ? (isLogin ? t('auth.loggingIn') : t('auth.registering'))
              : (isLogin ? t('auth.login') : t('auth.register'))
            }
          </button>
        </form>

        <div className="mt-6 text-center">
          {isLogin ? (
            <p className="text-sm text-[#848464]">
              {t('auth.noAccount')}{' '}
              <button
                type="button"
                onClick={() => switchMode('register')}
                className="text-[#D48166] font-bold hover:underline cursor-pointer"
              >
                {t('auth.registerHere')}
              </button>
            </p>
          ) : (
            <p className="text-sm text-[#848464]">
              {t('auth.hasAccount')}{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-[#D48166] font-bold hover:underline cursor-pointer"
              >
                {t('auth.loginHere')}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
