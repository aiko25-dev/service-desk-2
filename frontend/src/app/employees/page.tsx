'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../../hooks/useApi';
import { useAuthStore } from '../../store/authStore';
import { useState } from 'react';
import { Users, Search, Mail, Shield, Briefcase, MapPin } from 'lucide-react';

export default function EmployeesPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // Fetch Employees List (try full roster list or fallback)
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employeesList'],
    queryFn: async () => {
      try {
        // Try getting full details if authorized (ADMIN, MANAGER, HR)
        const res = await api.get('/users');
        return res.data;
      } catch (err: any) {
        if (err.response?.status === 403) {
          // Fallback to active roster for other roles (OPERATOR, ACCOUNTANT)
          const res = await api.get('/users/roster');
          return res.data;
        }
        throw err;
      }
    },
    enabled: !!user,
  });

  const filtered = employees.filter((emp: any) => {
    const name = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const matchesSearch = name.includes(search.toLowerCase()) || emp.email.toLowerCase().includes(search.toLowerCase());
    const matchesDept = !deptFilter || (emp.department && emp.department === deptFilter);
    return matchesSearch && matchesDept;
  });

  // Extract unique departments for filtering
  const departments = Array.from(new Set(employees.map((e: any) => e.department).filter(Boolean)));

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-50 text-red-700 border border-red-200';
      case 'MANAGER': return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'OPERATOR': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'HR': return 'bg-teal-50 text-teal-700 border border-teal-200';
      case 'ACCOUNTANT': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      default: return 'bg-slate-50 text-slate-700 border border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="border-b border-[#dfe1e6] pb-4">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Корпоративті анықтамалық</span>
        <h2 className="text-xl font-bold text-slate-800 leading-tight">Қызметкерлер тізімі (Employees)</h2>
      </div>

      {/* Filter and search */}
      <div className="premium-card p-4 bg-white border border-[#dfe1e6] flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Аты-жөні немесе email арқылы іздеу..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all font-semibold"
          />
        </div>

        <div className="w-full md:w-64 text-xs font-semibold">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-650 outline-none"
          >
            <option value="">Барлық бөлімдер</option>
            {departments.map((d: any) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of employees cards */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-450 font-bold text-xs">Жүктелуде...</div>
      ) : filtered.length === 0 ? (
        <div className="premium-card p-12 text-center text-slate-450 text-xs font-semibold">
          <Users size={32} className="mx-auto text-slate-300 mb-2" />
          Сұраныс бойынша қызметкерлер табылмады
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((emp: any) => (
            <div key={emp.id} className="premium-card p-4 bg-white border border-[#dfe1e6] flex flex-col justify-between h-[180px]">
              <div>
                <div className="flex justify-between items-start gap-2">
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-bold text-slate-800 truncate">
                      {emp.firstName} {emp.lastName}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 mt-0.5">
                      <Mail size={12} />
                      {emp.email}
                    </span>
                  </div>
                  
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase shrink-0 ${getRoleBadgeStyle(emp.role)}`}>
                    {emp.role}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-[10px] font-semibold text-slate-600">
                  {emp.department && (
                    <div className="flex items-center gap-2">
                      <Briefcase size={12} className="text-slate-400" />
                      <span>{emp.department}</span>
                    </div>
                  )}
                  {emp.position && (
                    <div className="flex items-center gap-2">
                      <MapPin size={12} className="text-slate-400" />
                      <span>{emp.position}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer status / Join date details if visible */}
              <div className="border-t border-slate-100 pt-2.5 mt-2 flex items-center justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                <span>Жүйедегі күйі</span>
                {emp.isActive !== false ? (
                  <span className="text-emerald-600">Белсенді</span>
                ) : (
                  <span className="text-red-500">Блокталған</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
