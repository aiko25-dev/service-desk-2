'use client';

import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../hooks/useApi';
import { Lock, Mail, Server, ShieldCheck, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { email, password });
      setAuth(res.data.access_token, res.data.user);
      router.replace('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Неверный логин или пароль');
    } finally {
      setIsLoading(false);
    }
  };

  // Demo Assist helper: Auto-fills standard seeded corporate roles
  const handleQuickLogin = (role: 'admin' | 'operator' | 'manager' | 'hr' | 'accountant') => {
    const capitalize = role.charAt(0).toUpperCase() + role.slice(1);
    setEmail(`${role}@company.com`);
    setPassword(`${capitalize}123!`);
    setError('');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-slate-950 overflow-hidden">
      {/* Visual background ambient gradient circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none" />

      {/* Login Card Panel */}
      <div className="relative w-full max-w-md bg-slate-900/60 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl p-8 overflow-hidden animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-500 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4 animate-pulse">
            <Server className="text-white" size={24} />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Вход в Service Desk</h2>
          <p className="text-sm text-slate-400 mt-1">Корпоративный портал управления заявками</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-950/40 border border-red-800/80 rounded-xl text-red-400 text-xs font-semibold flex items-center gap-2">
            <ShieldCheck size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Рабочий Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                <Mail size={16} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-slate-950/50 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 outline-none transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Пароль</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                <Lock size={16} />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/50 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 outline-none transition-all duration-200"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white rounded-xl py-2.5 text-sm font-semibold tracking-wide flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/10 active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Войти в систему</span>
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Login Toolbar */}
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Sparkles size={12} className="text-teal-400" />
            Быстрый вход для тестирования:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[
              { role: 'admin', label: 'Админ' },
              { role: 'operator', label: 'Оператор' },
              { role: 'manager', label: 'Директор' },
              { role: 'hr', label: 'HR Кадры' },
              { role: 'accountant', label: 'Бухгалтер' },
            ].map((btn) => (
              <button
                key={btn.role}
                type="button"
                onClick={() => handleQuickLogin(btn.role as any)}
                className="px-2 py-1.5 text-left bg-slate-800/40 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg text-xs text-slate-300 font-medium transition-all duration-200"
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
