import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock } from 'lucide-react';
import { loginApi } from '@api/auth';
import { useTranslation } from 'react-i18next';

export const LoginPrompt: React.FC<{ message?: string }> = ({ message }) => {
  const { login } = useAuth();
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password.trim()) return;
    
    setLoading(true);
    try {
      const user = await loginApi(username, password);
      login(user);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-md mx-auto w-full min-h-[60vh]">
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-[#EAEAE0] w-full text-center">
        <div className="w-16 h-16 bg-[#F5F5F0] rounded-full flex items-center justify-center mx-auto mb-6 text-[#5A5A40]">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-[#5A5A40] mb-2">{t('auth.authentication')}</h2>
        <p className="text-[#848464] mb-8 text-sm md:text-base">{message || t('messages.loginHistory')}</p>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-6 text-left border border-red-100">{t('auth.loginFailed')}</div>}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-sm font-bold text-[#5A5A40] mb-1">{t('auth.username')}</label>
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
            <label className="block text-sm font-bold text-[#5A5A40] mb-1">{t('auth.password')}</label>
            <input 
              type="password"
              required
              className="w-full border border-[#E0E0D5] bg-[#F5F5F0] rounded-xl px-4 py-3 outline-none focus:border-[#D48166] transition-colors"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t('auth.enterPassword')}
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-[#D48166] text-white font-bold rounded-xl py-3 mt-2 hover:bg-[#C27055] transition-colors disabled:opacity-50"
          >
            {loading ? t('auth.loggingIn') : t('auth.login')}
          </button>
        </form>
      </div>
    </div>
  );
};
