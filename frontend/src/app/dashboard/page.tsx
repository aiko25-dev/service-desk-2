'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../../hooks/useApi';
import { useAuthStore } from '../../store/authStore';
import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import {
  Activity,
  CheckCircle2,
  Clock,
  FileText,
  ListTodo,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: kpis, isLoading } = useQuery({
    queryKey: ['kpis'],
    queryFn: async () => {
      const res = await api.get('/tickets/kpi');
      return res.data;
    },
    enabled: !!user,
  });

  const { data: tasks } = useQuery({
    queryKey: ['dashboardTasks'],
    queryFn: async () => {
      const res = await api.get('/tasks');
      return res.data;
    },
    enabled: !!user,
  });

  if (isLoading || !mounted) {
    return <div className="flex items-center justify-center min-h-[60vh] text-slate-400 text-sm">Загрузка данных панели...</div>;
  }

  const COLORS = ['#3b82f6', '#0d9488', '#f59e0b', '#ef4444', '#10b981', '#6366f1'];

  const statusMap: Record<string, string> = {
    NEW: 'Новая',
    ACCEPTED: 'Принята',
    IN_PROGRESS: 'В работе',
    PENDING_APPROVAL: 'Согласование',
    CLOSED: 'Закрыта',
    REJECTED: 'Отклонена',
  };

  const statusColors: Record<string, string> = {
    NEW: 'bg-blue-50 text-blue-700 border-blue-200',
    ACCEPTED: 'bg-sky-50 text-sky-700 border-sky-200',
    IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
    PENDING_APPROVAL: 'bg-purple-50 text-purple-700 border-purple-200',
    CLOSED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const chartData = kpis?.statusChart?.map((item: any) => ({
    name: statusMap[item.name] || item.name,
    value: item.value,
  })) || [];

  const pendingTasks = tasks?.filter((t: any) => t.status !== 'DONE').slice(0, 4) || [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-[15%] translate-y-[-15%] w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <h2 className="text-xl md:text-2xl font-bold">Рады видеть вас, {user?.firstName}!</h2>
        <p className="text-blue-100 text-xs md:text-sm mt-1">
          Все системы работают в штатном режиме. У вас {pendingTasks.length} незавершенных задач в списке.
        </p>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Всего обращений', value: kpis?.total || 0, icon: FileText, color: 'text-blue-600 bg-blue-50 border-blue-100' },
          { label: 'Активные', value: kpis?.open || 0, icon: Activity, color: 'text-sky-600 bg-sky-50 border-sky-100' },
          { label: 'В работе', value: kpis?.inProgress || 0, icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-100' },
          { label: 'Решенные', value: kpis?.closed || 0, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="premium-card p-5 flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{stat.label}</span>
                <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mt-1.5">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-xl border shrink-0 ${stat.color}`}>
                <Icon size={24} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Content Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tickets Table */}
        <div className="lg:col-span-2 premium-card p-5 flex flex-col justify-between min-h-[350px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-semibold text-slate-800 flex items-center gap-2">
                <TrendingUp size={18} className="text-blue-500" />
                Последние обращения
              </h3>
              <Link href="/tickets" className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
                Все заявки
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 pb-2">
                    <th className="py-2.5 font-semibold">Тема</th>
                    <th className="py-2.5 font-semibold">Автор</th>
                    <th className="py-2.5 font-semibold">Статус</th>
                    <th className="py-2.5 font-semibold">Приоритет</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {kpis?.recent?.map((ticket: any) => (
                    <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 pr-4 max-w-[200px] truncate">
                        <Link href={`/tickets?id=${ticket.id}`} className="hover:text-blue-600 font-semibold text-slate-800">
                          {ticket.title}
                        </Link>
                      </td>
                      <td className="py-3 text-slate-500">{ticket.creator.firstName} {ticket.creator.lastName}</td>
                      <td className="py-3">
                        <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-bold ${statusColors[ticket.status]}`}>
                          {statusMap[ticket.status] || ticket.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          ticket.priority === 'HIGH' ? 'text-red-500' : ticket.priority === 'MEDIUM' ? 'text-amber-500' : 'text-slate-400'
                        }`}>
                          {ticket.priority}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!kpis?.recent || kpis.recent.length === 0) && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">Нет активных обращений</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recharts Pie Chart widget */}
        <div className="premium-card p-5 flex flex-col justify-between min-h-[350px]">
          <div>
            <h3 className="text-md font-semibold text-slate-800 mb-4">Статусы заявок</h3>
            <div className="h-48 w-full flex items-center justify-center">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <span className="text-xs text-slate-400">Нет данных для графиков</span>
              )}
            </div>
          </div>
          {chartData.length > 0 && (
            <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100">
              {chartData.map((d: any, idx: number) => (
                <div key={idx} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="truncate">{d.name}: {d.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tasks Widget Block */}
      <div className="premium-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-md font-semibold text-slate-800 flex items-center gap-2">
            <ListTodo size={18} className="text-teal-500" />
            Ваши оперативные задачи
          </h3>
          <Link href="/kanban" className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
            Kanban доска
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pendingTasks.map((task: any) => (
            <div key={task.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors flex justify-between items-center text-xs font-semibold">
              <div className="space-y-1 overflow-hidden pr-4">
                <p className="text-slate-800 font-bold truncate">{task.title}</p>
                {task.ticket && (
                  <span className="text-[10px] text-slate-400 font-medium block truncate">
                    К заявке: {task.ticket.title}
                  </span>
                )}
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide shrink-0 ${
                task.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'
              }`}>
                {task.status === 'IN_PROGRESS' ? 'В работе' : 'План'}
              </span>
            </div>
          ))}
          {pendingTasks.length === 0 && (
            <div className="col-span-2 py-8 text-center text-slate-400 text-xs">Все задачи завершены!</div>
          )}
        </div>
      </div>
    </div>
  );
}
