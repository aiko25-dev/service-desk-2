'use client';

import { useAuthStore } from '../../store/authStore';
import { api } from '../../hooks/useApi';
import { useState } from 'react';
import { Settings, User, Shield, Check, Info } from 'lucide-react';

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [position, setPosition] = useState(user?.position || '');
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  if (!user) return null;

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError('');

    try {
      const res = await api.put(`/users/${user.id}`, {
        firstName,
        lastName,
        department,
        position,
      });

      // Update Zustand local storage & state
      updateUser({
        firstName: res.data.firstName,
        lastName: res.data.lastName,
        department: res.data.department,
        position: res.data.position,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.response?.data?.message || 'Профиль мәліметтерін сақтау мүмкін болмады');
    } finally {
      setIsSaving(false);
    }
  };

  // Static role information matrix
  const getRolePermissions = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return [
          'Өтінімдер жүйесін басқару және реттеу',
          'Қызметкерлер тізімін бақылау, блоктау немесе жаңа қолданушылар қосу',
          'Ішкі хат алмасуды және файлдар мұрағатын басқару',
          'Жүйелік логтарды және әкімшілік баптауларды қарау',
        ];
      case 'MANAGER':
        return [
          'Барлық өтінімдерді қарау және мақұлдау/қабылдамау',
          'Қаржылық шығындарды және демалыс өтініштерін бекіту',
          'Кадрлық бұйрықтармен танысу',
          'Ішкі хат алмасу және тапсырмаларды қызметкерлерге тағайындау',
        ];
      case 'OPERATOR':
        return [
          'Кіріс өтінімдерді қабылдау және жұмыс процесін басқару',
          'Тапсырмаларды орындау және олардың статусын Kanban тақтасында өзгерту',
          'Қызметкерлер тізімін қарау',
        ];
      case 'HR':
        return [
          'Демалыс өтініштерін тіркеу және өңдеу',
          'Кадрлық бұйрықтар мен распоряженияларды құру',
          'Қызметкерлер тізімі мен мәліметтерін басқару',
        ];
      case 'ACCOUNTANT':
        return [
          'Қаржылық сұраныстар мен шығын сметтерін өңдеу',
          'Есептер жүктеу және Excel выгрузкаларын жасау',
          'Қызметкерлер тізімін қарау',
        ];
      default:
        return ['Қарапайым рұқсат деңгейі'];
    }
  };

  const permissions = getRolePermissions(user.role);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="border-b border-[#dfe1e6] pb-4">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Платформа параметрлері</span>
        <h2 className="text-xl font-bold text-slate-800 leading-tight">Баптаулар (Settings)</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: User Profile updates */}
        <div className="md:col-span-2 premium-card p-5 bg-white border border-[#dfe1e6] space-y-4">
          <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
            <User size={15} className="text-blue-500" />
            Жеке профиль мәліметтері
          </h3>

          <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs font-bold text-slate-700">
            {saveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-250 text-emerald-700 rounded-xl text-[10px] font-bold flex items-center gap-2">
                <Check size={14} />
                <span>Жеке мәліметтер сәтті жаңартылды!</span>
              </div>
            )}

            {saveError && (
              <div className="p-3 bg-rose-50 border border-rose-250 text-rose-700 rounded-xl text-[10px] font-bold flex items-center gap-2">
                <span>{saveError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1">Аты (First name)</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl p-2.5 text-xs text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1">Тіркелген Тегі (Last name)</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl p-2.5 text-xs text-slate-800 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1">Электрондық пошта (Email)</label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-400 outline-none cursor-not-allowed font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1">Департамент / Бөлім</label>
                <input
                  type="text"
                  placeholder="IT, Бухгалтерия, HR..."
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl p-2.5 text-xs text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1">Лауазымы</label>
                <input
                  type="text"
                  placeholder="Инженер, Менеджер..."
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl p-2.5 text-xs text-slate-800 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all text-xs shadow-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>{isSaving ? 'Сақталуда...' : 'Өзгерістерді сақтау'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Roles permissions description */}
        <div className="premium-card p-5 bg-white border border-[#dfe1e6] space-y-4">
          <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
            <Shield size={15} className="text-purple-500" />
            Қолжетімділік деңгейі (RBAC)
          </h3>

          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 p-2.5 rounded-xl text-[10px] font-bold text-purple-700">
              <Info size={14} className="shrink-0" />
              <span className="uppercase">Сіздің рөліңіз: {user.role}</span>
            </div>

            <div className="space-y-2">
              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Сіздегі құқықтар:</span>
              <ul className="space-y-2 text-[10px] font-semibold text-slate-600 list-disc pl-4 leading-normal">
                {permissions.map((p, idx) => (
                  <li key={idx}>{p}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
