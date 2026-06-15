import React, { useEffect, useState, useMemo } from 'react';
import { BookOpen, Heart, Clock, Trophy, ArrowRight, LogOut, ShieldCheck, Globe, Sun, Moon, Gift, Crown, Calendar, KeyRound, Copy, Check, History } from 'lucide-react';
import { fetchLibraryData } from '@api/general';
import { useNavigate } from 'react-router-dom';
import { GithubHeatmap } from '../../components/GithubHeatmap';
import { useAuth } from '../../context/AuthContext';
import { LoginPrompt } from '../../components/LoginPrompt';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { redeemKeyApi } from '@api/auth';
import { generateKeyApi } from '@api/admin';

export const LibraryPage: React.FC = () => {
  const { user, login, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // 卡密兑换状态
  const [showRedeem, setShowRedeem] = useState(false);
  const [redeemKey, setRedeemKey] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);

  // Admin: 卡密生成状态
  const [showGenKey, setShowGenKey] = useState(false);
  const [vipType, setVipType] = useState<string>('lifetime');
  const [vipCustomDays, setVipCustomDays] = useState('');
  const [genLoading, setGenLoading] = useState(false);
  const [genKeyResult, setGenKeyResult] = useState<{ key: string; vipLabel: string } | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemKey.trim()) return;
    setRedeemLoading(true);
    setRedeemError(null);
    setRedeemSuccess(null);
    try {
      const updatedUser = await redeemKeyApi(redeemKey.trim());
      login(updatedUser);
      setRedeemSuccess(t('library.redeemSuccess'));
      setRedeemKey('');
    } catch (err: any) {
      setRedeemError(err.message || t('library.redeemFailed'));
    } finally {
      setRedeemLoading(false);
    }
  };

  // Admin: 生成卡密
  const handleGenKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenLoading(true);
    setGenError(null);
    setGenKeyResult(null);
    try {
      let vipDays: number | null = null;
      if (vipType === 'lifetime') {
        vipDays = null;
      } else if (vipType === 'custom') {
        const d = parseInt(vipCustomDays, 10);
        if (!d || d < 1) { setGenError(t('library.validDays')); setGenLoading(false); return; }
        vipDays = d;
      } else {
        vipDays = parseInt(vipType, 10);
      }
      const result = await generateKeyApi(vipDays);
      const label = vipDays === null ? t('library.lifetime') : `${vipDays} ${t('library.daysUnit')}`;
      setGenKeyResult({ key: result.key, vipLabel: label });
    } catch (err: any) {
      setGenError(err.message || t('library.genFailed'));
    } finally {
      setGenLoading(false);
    }
  };

  const handleCopyKey = async () => {
    if (!genKeyResult) return;
    try {
      await navigator.clipboard.writeText(genKeyResult.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  // 格式化 VIP 到期信息
  const vipExpiryInfo = useMemo(() => {
    if (!user || user.role !== 'vip') return null;
    if (!user.vipExpiresAt) {
      return { label: t('library.lifetime'), isLifetime: true };
    }
    const now = Date.now();
    const exp = new Date(user.vipExpiresAt).getTime();
    const daysLeft = Math.max(0, Math.ceil((exp - now) / (1000 * 60 * 60 * 24)));
    const dateStr = new Date(user.vipExpiresAt).toLocaleDateString(
      i18n.language === 'zh' ? 'zh-CN' : 'en-US',
      { month: 'short', day: 'numeric' }
    );
    return { label: t('library.daysLeft', { days: daysLeft }), secondary: dateStr, isLifetime: false, daysLeft };
  }, [user, i18n.language, t]);

  useEffect(() => {
    if (!user) return;
    
    fetchLibraryData()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(t('error.loadLibrary'));
        setLoading(false);
      });
  }, [user]);

  if (!user) {
    return <LoginPrompt message={t('messages.loginLibrary')} />;
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-4 border-[#E0E0D5] border-t-[#D48166] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 min-h-[50vh]">
        <div className="text-[#D48166] font-bold">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-10">
      {/* User Profile Card */}
      <div className="bg-white p-6 md:p-8 rounded-[32px] border border-[#E0E0D5] shadow-sm flex flex-col md:flex-row md:items-center gap-6 relative overflow-hidden dark:bg-[#151B25] dark:border-[#1E293B]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#D48166]/10 to-transparent rounded-bl-full pointer-events-none" />
        <div className="absolute bottom-0 right-20 w-40 h-40 bg-gradient-to-tl from-[#94A684]/5 to-transparent rounded-tl-full pointer-events-none" />
        
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-[#D48166] to-[#C27055] flex flex-shrink-0 items-center justify-center text-white text-3xl md:text-4xl font-serif font-bold shadow-lg uppercase border-[6px] border-[#F5F5F0] dark:border-[#0B0E14]">
          {user.username.charAt(0)}
        </div>
        
        <div className="flex-1 z-10">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#5A5A40] dark:text-[#F8FAFC]">
              {user.username}
            </h2>
            {user.role === 'vip' ? (
              <span className={`inline-flex items-center gap-1.5 text-[11px] md:text-xs font-bold tracking-wider px-3 py-1.5 rounded-full shadow-sm border ${
                vipExpiryInfo?.isLifetime
                  ? 'bg-[#E1B12C]/10 border-[#E1B12C]/30 text-[#C29828]'
                  : (vipExpiryInfo?.daysLeft ?? 0) <= 7
                    ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                    : 'bg-[#E1B12C]/10 border-[#E1B12C]/30 text-[#C29828]'
              }`}>
                {vipExpiryInfo?.isLifetime ? (
                  <Crown className="w-3.5 h-3.5" />
                ) : (
                  <Calendar className="w-3 h-3" />
                )}
                <span>VIP</span>
                <span className="opacity-40">·</span>
                <span>{vipExpiryInfo?.label}</span>
                {vipExpiryInfo?.secondary && (
                  <span className="opacity-50 font-normal text-[10px]">({vipExpiryInfo.secondary})</span>
                )}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-[#94A684]/10 border border-[#94A684]/30 text-[#71855F] text-[11px] md:text-xs uppercase font-bold tracking-widest px-3 py-1 rounded-full shadow-sm">
                {t('library.standard')}
              </span>
            )}
          </div>
          <p className="text-[#8A8A7A] dark:text-[#64748B] text-sm mb-3 max-w-lg">
            {t('library.bio')}
          </p>
          <div className="flex items-center gap-4 text-xs font-bold text-[#6A6A5A] dark:text-[#94A3B8]">
            <span>
              {t('library.joined')} {user.createdAt
                ? new Date(user.createdAt).toLocaleDateString(i18n.language === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                : '—'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Trophy className="w-6 h-6 text-[#D48166]" />} label={t('library.perfectDays')} value={data.stats.streak} />
        <StatCard icon={<BookOpen className="w-6 h-6 text-[#94A684]" />} label={t('library.vocabBuilt')} value={data.stats.words} />
        <StatCard icon={<Heart className="w-6 h-6 text-[#D48166] fill-current" />} label={t('library.totalStudy')} value={data.stats.sentences} />
        <StatCard icon={<Clock className="w-6 h-6 text-[#5A5A40]" />} label={t('library.videosWatched')} value={data.stats.hours} />
      </div>

      <GithubHeatmap />

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/history')}
          className="bg-white dark:bg-[#151B25] p-5 rounded-[24px] border border-[#E0E0D5] dark:border-[#1E293B] shadow-sm flex items-center gap-4 hover:border-[#D48166]/30 hover:-translate-y-0.5 transition-all text-left group"
        >
          <div className="w-12 h-12 bg-[#D48166]/10 rounded-xl flex items-center justify-center shrink-0">
            <History className="w-6 h-6 text-[#D48166]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-[#4A4A40] dark:text-[#F8FAFC]">{t('library.history')}</div>
            <div className="text-xs text-[#8A8A7A] dark:text-[#94A3B8] mt-0.5">{t('library.historyDesc')}</div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#8A8A7A] dark:text-[#94A3B8] group-hover:text-[#D48166] transition-colors shrink-0" />
        </button>
      </div>

      {/* Admin: Generate Key Section */}
      {user.username === 'admin' && (
        <div className="bg-white p-5 md:p-6 rounded-[24px] border border-[#E0E0D5] shadow-sm dark:bg-[#151B25] dark:border-[#1E293B]">
          <button
            onClick={() => { setShowGenKey(!showGenKey); setGenError(null); setGenKeyResult(null); }}
            className="flex items-center gap-2 text-sm font-bold text-[#6A6A5A] dark:text-[#94A3B8] hover:text-[#D48166] transition-colors"
          >
            <KeyRound className="w-4 h-4" />
            {t('library.genKey')}
          </button>

          {showGenKey && (
            <form onSubmit={handleGenKey} className="mt-4 space-y-3">
              {genError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                  {genError}
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-[#5A5A40] dark:text-gray-300">{t('library.vipType')}:</span>
                {([
                  { key: 'lifetime', label: t('library.vipLifetime') },
                  { key: '7', label: t('library.vip7Days') },
                  { key: '30', label: t('library.vip30Days') },
                  { key: '90', label: t('library.vip90Days') },
                  { key: '180', label: t('library.vip180Days') },
                  { key: '365', label: t('library.vip365Days') },
                  { key: 'custom', label: t('library.custom') }
                ]).map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setVipType(opt.key)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                      vipType === opt.key
                        ? 'bg-[#D48166] text-white border-[#D48166]'
                        : 'bg-[#F5F5F0] dark:bg-[#1E293B] text-[#6A6A5A] dark:text-gray-400 border-[#E0E0D5] dark:border-gray-700 hover:border-[#D48166]/30'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
                {vipType === 'custom' && (
                  <input
                    type="number"
                    min={1}
                    className="w-16 border border-[#E0E0D5] bg-[#F5F5F0] dark:bg-[#1E293B] dark:border-[#2a323f] rounded-lg px-2 py-1.5 outline-none focus:border-[#D48166] transition-colors text-xs"
                    value={vipCustomDays}
                    onChange={e => setVipCustomDays(e.target.value)}
                    placeholder={t('library.daysUnit')}
                  />
                )}
              </div>

              <button
                type="submit"
                disabled={genLoading}
                className="bg-[#D48166] text-white font-bold rounded-xl px-6 py-2.5 hover:bg-[#C27055] transition-colors disabled:opacity-50 text-sm"
              >
                {genLoading ? t('library.genLoading') : t('library.doGen')}
              </button>

              {genKeyResult && (
                <div className="mt-3 p-4 bg-gradient-to-r from-[#D48166]/8 to-[#C27055]/8 rounded-xl border border-[#D48166]/20">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold text-[#8A8A7A] uppercase tracking-wider mb-1">{t('library.generatedKey')} ({genKeyResult.vipLabel})</p>
                      <p className="font-mono text-base font-bold text-[#5A5A40] dark:text-white tracking-widest select-all">{genKeyResult.key}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyKey}
                      className={`shrink-0 p-2.5 rounded-xl border transition-colors ${
                        copied
                          ? 'bg-green-50 border-green-200 text-green-600'
                          : 'bg-white border-[#E0E0D5] text-[#6A6A5A] hover:border-[#D48166] hover:text-[#D48166]'
                      }`}
                      title={copied ? t('library.copied') : t('library.copy')}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      )}

      {/* Redeem Key Section - 隐藏终生会员 */}
      {!vipExpiryInfo?.isLifetime && (
        <div className="bg-white p-5 md:p-6 rounded-[24px] border border-[#E0E0D5] shadow-sm dark:bg-[#151B25] dark:border-[#1E293B]">
        <button
          onClick={() => { setShowRedeem(!showRedeem); setRedeemError(null); setRedeemSuccess(null); }}
          className="flex items-center gap-2 text-sm font-bold text-[#6A6A5A] dark:text-[#94A3B8] hover:text-[#D48166] transition-colors"
        >
          <Gift className="w-4 h-4" />
          {t('library.redeemKey')}
        </button>

        {showRedeem && (
          <form onSubmit={handleRedeem} className="mt-4 space-y-3">
            {redeemSuccess && (
              <div className="bg-green-50 text-green-600 p-3 rounded-xl text-sm border border-green-100">
                {redeemSuccess}
              </div>
            )}
            {redeemError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">
                {redeemError}
              </div>
            )}
            <div className="flex gap-3">
              <input
                type="text"
                required
                className="flex-1 border border-[#E0E0D5] bg-[#F5F5F0] dark:bg-[#1E293B] dark:border-[#2a323f] rounded-xl px-4 py-2.5 outline-none focus:border-[#D48166] transition-colors text-sm"
                value={redeemKey}
                onChange={e => setRedeemKey(e.target.value)}
                placeholder={t('library.enterRedeemKey')}
              />
              <button
                type="submit"
                disabled={redeemLoading}
                className="bg-[#D48166] text-white font-bold rounded-xl px-6 py-2.5 hover:bg-[#C27055] transition-colors disabled:opacity-50 text-sm"
              >
                {redeemLoading ? t('library.redeeming') : t('library.doRedeem')}
              </button>
            </div>
          </form>
        )}
      </div>
      )}
      
      {/* Settings / Sign Out Actions */}
      <div className="pt-8 flex flex-col md:flex-row items-center gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-white dark:bg-[#151B25] p-2 rounded-xl flex border border-[#E0E0D5] dark:border-[#1E293B] shadow-sm">
             <button 
               onClick={() => i18n.changeLanguage('en')}
               className={`px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-all ${i18n.language.startsWith('en') ? 'bg-[#94A684] text-white' : 'text-[#8A8A7A] dark:text-[#94A3B8] hover:bg-[#F5F5F0] dark:hover:bg-[#1E293B]'}`}
             >
               <Globe className="w-4 h-4" /> {t('library.english')}
             </button>
             <button 
               onClick={() => i18n.changeLanguage('zh')}
               className={`px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-all ${i18n.language.startsWith('zh') ? 'bg-[#94A684] text-white' : 'text-[#8A8A7A] dark:text-[#94A3B8] hover:bg-[#F5F5F0] dark:hover:bg-[#1E293B]'}`}
             >
               <Globe className="w-4 h-4" /> {t('library.chinese')}
             </button>
          </div>

          <div className="bg-white p-2 rounded-xl flex border border-[#E0E0D5] shadow-sm">
             <button 
               onClick={toggleTheme}
               className={`px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-all ${theme === 'light' ? 'bg-[#4A4A40] text-white' : 'text-[#8A8A7A] hover:bg-[#F5F5F0]'}`}
             >
               <Sun className="w-4 h-4" /> {t('library.lightMode')}
             </button>
             <button 
               onClick={toggleTheme}
               className={`px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-all ${theme === 'dark' ? 'bg-[#4A4A40] text-white' : 'text-[#8A8A7A] hover:bg-[#F5F5F0]'}`}
             >
               <Moon className="w-4 h-4" /> {t('library.darkMode')}
             </button>
          </div>
        </div>

        <button 
          onClick={logout}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-[#E0E0D5] text-[#8A8A7A] hover:bg-[#F9F9F7] hover:text-[#D48166] hover:border-[#D48166]/30 text-sm font-bold rounded-xl transition-all shadow-sm w-full md:w-auto md:ml-auto"
        >
          <LogOut className="w-4 h-4" /> {t('library.signOut')}
        </button>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value }: any) => (
  <div className="bg-white p-5 lg:p-6 rounded-[24px] border border-[#E0E0D5] shadow-sm flex flex-col gap-3 hover:border-[#94A684] hover:-translate-y-1 transition-all">
    <div className="w-12 h-12 bg-[#F9F9F7] rounded-xl border border-[#E0E0D5] flex items-center justify-center">
        {icon}
    </div>
    <div>
       <div className="text-3xl font-serif font-bold text-[#4A4A40] mb-0.5">{value}</div>
       <div className="text-[10px] font-bold text-[#8A8A7A] uppercase tracking-widest leading-tight">{label}</div>
    </div>
  </div>
);
