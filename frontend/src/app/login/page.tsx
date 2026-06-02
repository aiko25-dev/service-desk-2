'use client';

import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../hooks/useApi';
import { Lock, Mail, Server, ShieldCheck, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../../context/LanguageContext';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { t, language, setLanguage } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError(t('loginRequiredError'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { email, password });
      setAuth(res.data.access_token, res.data.user);
      router.replace('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || t('loginInvalidError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-slate-50 overflow-hidden font-sans">
      {/* Visual background ambient gradient circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />

      {/* Language Switcher in Login Page */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm text-xs font-bold text-slate-700 z-55">
        <Globe size={14} className="text-slate-400 ml-1" />
        {[
          { key: 'kk', label: 'ҚАЗ' },
          { key: 'ru', label: 'РУС' },
          { key: 'en', label: 'ENG' }
        ].map((l) => (
          <button
            key={l.key}
            type="button"
            onClick={() => setLanguage(l.key as any)}
            className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
              language === l.key ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Login Card Panel */}
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-8 overflow-hidden animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 mb-4">
            <Server className="text-white" size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">{t('loginTitle')}</h2>
          <p className="text-xs text-slate-400 mt-1 font-semibold">{t('loginSubtitle')}</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-semibold flex items-center gap-2">
            <ShieldCheck size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs font-bold text-slate-700">
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-slate-450 mb-1.5">{t('loginEmailLabel')}</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-450 pointer-events-none">
                <Mail size={16} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[9px] uppercase tracking-wider text-slate-450 mb-1.5">{t('loginPasswordLabel')}</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-450 pointer-events-none">
                <Lock size={16} />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 font-semibold"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-xs font-semibold tracking-wide flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 mt-2"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>{t('loginBtn')}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
