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
      setError('Электрондық пошта мен құпия сөзді толтырыңыз');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { email, password });
      setAuth(res.data.access_token, res.data.user);
      router.replace('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Пошта немесе құпия сөз қате');
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
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-slate-50 overflow-hidden font-sans">
      {/* Visual background ambient gradient circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />

      {/* Login Card Panel */}
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-8 overflow-hidden animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 mb-4">
            <Server className="text-white" size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Service Desk жүйесіне кіру</h2>
          <p className="text-xs text-slate-400 mt-1 font-semibold">Корпоративтік өтінімдерді басқару порталы</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-semibold flex items-center gap-2">
            <ShieldCheck size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs font-bold text-slate-700">
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-slate-450 mb-1.5">Жұмыс поштасы (Email)</label>
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
            <label className="block text-[9px] uppercase tracking-wider text-slate-450 mb-1.5">Құпия сөз (Password)</label>
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
              <span>Порталға кіру</span>
            )}
          </button>
        </form>

        {/* Demo Fast Login Toolbar */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Sparkles size={12} className="text-blue-500" />
            Тестілеуге арналған жылдам кіру:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs font-semibold">
            {[
              { role: 'admin', label: 'Администратор' },
              { role: 'operator', label: 'IT Оператор' },
              { role: 'manager', label: 'Жетекші' },
              { role: 'hr', label: 'HR Кадрлар' },
              { role: 'accountant', label: 'Бухгалтер' },
            ].map((btn) => (
              <button
                key={btn.role}
                type="button"
                onClick={() => handleQuickLogin(btn.role as any)}
                className="px-2 py-1.5 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] text-slate-650 font-bold transition-all duration-150 cursor-pointer"
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
