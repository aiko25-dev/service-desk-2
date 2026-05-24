'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../hooks/useApi';
import { useAuthStore } from '../../store/authStore';
import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import {
  Wallet,
  Plus,
  X,
  TrendingUp,
  Download,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingDown
} from 'lucide-react';

export default function FinancePage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  // Expense Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Программное обеспечение (Software)');
  const [description, setDescription] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch Finance Claims
  const { data: claims, isLoading: isLoadingClaims } = useQuery({
    queryKey: ['claims'],
    queryFn: async () => {
      const res = await api.get('/finance');
      return res.data;
    },
    enabled: !!user,
  });

  // Fetch Stats (for charts)
  const { data: stats } = useQuery({
    queryKey: ['financeStats'],
    queryFn: async () => {
      const res = await api.get('/finance/stats');
      return res.data;
    },
    enabled: !!user && (user.role === 'ACCOUNTANT' || user.role === 'MANAGER' || user.role === 'ADMIN'),
  });

  // Create Claim Mutation
  const createClaimMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/finance', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      queryClient.invalidateQueries({ queryKey: ['financeStats'] });
      setIsOpen(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setCategory('Программное обеспечение (Software)');
    setDescription('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createClaimMutation.mutate({
      title,
      amount: Number(amount),
      category,
      description,
    });
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/finance/export', {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `expenses_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export finance:', error);
      alert('Ошибка при экспорте финансовых данных');
    }
  };

  const statusMap: Record<string, string> = {
    PENDING: 'Ожидает решения',
    APPROVED: 'Одобрена',
    REJECTED: 'Отклонена',
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-purple-50 text-purple-700 border-purple-200',
    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const COLORS = ['#3b82f6', '#0d9488', '#f59e0b', '#ef4444', '#10b981'];

  const isFinanceTeam = user?.role === 'ACCOUNTANT' || user?.role === 'MANAGER' || user?.role === 'ADMIN';

  if (!mounted) {
    return <div className="text-center py-12 text-slate-400 text-xs">Загрузка財務...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in flex flex-col h-[calc(100vh-8rem)]">
      {/* Header Row */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Корпоративная бухгалтерия</span>
          <h2 className="text-xl font-bold text-slate-800 leading-tight">Финансовые расходы и компенсации</h2>
        </div>
        
        <div className="flex gap-2">
          {isFinanceTeam && (
            <button
              onClick={handleExport}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
              title="Экспорт в Excel"
            >
              <Download size={15} />
              <span>Скачать отчет</span>
            </button>
          )}

          <button
            onClick={() => setIsOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
          >
            <Plus size={15} />
            <span>Подать на расходы</span>
          </button>
        </div>
      </div>

      {/* Grid Analytics Row */}
      {isFinanceTeam && stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
          {/* Spent metric card */}
          <div className="premium-card p-5 flex flex-col justify-between min-h-[140px]">
            <div>
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Общий объем одобренных выплат</span>
              <h3 className="text-3xl font-extrabold text-slate-800 mt-2">
                {stats.totalSpent?.toLocaleString() || 0} ₽
              </h3>
            </div>
            <div className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
              <TrendingUp size={12} />
              <span>Подтверждено бухгалтерией</span>
            </div>
          </div>

          {/* Chart Breakdown visual */}
          <div className="md:col-span-2 premium-card p-5 flex items-center justify-between min-h-[140px]">
            <div className="flex-1 max-w-[180px]">
              <h4 className="text-slate-800 font-bold text-xs">Распределение по категориям</h4>
              <p className="text-[10px] text-slate-400 font-medium mt-1 leading-normal">
                Статистика составлена на основе одобренных менеджером смет расходов.
              </p>
            </div>

            <div className="h-28 w-44 flex items-center justify-center relative shrink-0">
              {stats.chartData && stats.chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={25}
                      outerRadius={45}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {stats.chartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: '9px', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <span className="text-[10px] text-slate-400">Нет выплат</span>
              )}
            </div>

            {stats.chartData && stats.chartData.length > 0 && (
              <div className="flex flex-col gap-1 pr-4 max-w-[200px] shrink-0 justify-center">
                {stats.chartData.map((d: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 truncate">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="truncate">{d.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ledger list */}
      <div className="flex-1 premium-card p-5 overflow-hidden flex flex-col justify-between">
        <div className="flex flex-col flex-1 overflow-hidden">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 shrink-0">
            <Wallet size={16} className="text-blue-500" />
            Реестр финансовых требований
          </h3>

          <div className="flex-1 overflow-y-auto pr-1">
            {isLoadingClaims ? (
              <div className="text-center py-12 text-slate-400 text-xs">Загрузка смет...</div>
            ) : claims?.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">Заявки отсутствуют</div>
            ) : (
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-100 pb-2">
                      <th className="py-2.5 font-semibold">Название сметы</th>
                      <th className="py-2.5 font-semibold">Сумма</th>
                      <th className="py-2.5 font-semibold">Категория</th>
                      <th className="py-2.5 font-semibold">Сотрудник</th>
                      <th className="py-2.5 font-semibold">Статус</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {claims?.map((claim: any) => (
                      <tr key={claim.id} className="hover:bg-slate-50/50">
                        <td className="py-3 font-semibold text-slate-800">
                          <div className="space-y-0.5">
                            <span>{claim.title}</span>
                            <span className="text-[10px] text-slate-400 font-medium block truncate max-w-[200px]" title={claim.description}>
                              {claim.description}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 font-bold text-slate-900">{claim.amount.toLocaleString()} ₽</td>
                        <td className="py-3 text-slate-500">{claim.category}</td>
                        <td className="py-3 text-slate-500">
                          {claim.creator.firstName} {claim.creator.lastName}
                        </td>
                        <td className="py-3">
                          <span className={`px-2.5 py-0.5 border rounded-full text-[9px] font-bold ${statusColors[claim.status]}`}>
                            {statusMap[claim.status] || claim.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CREATE REIMBURSE CLAIM MODAL */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 w-full max-w-md overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Plus size={16} className="text-blue-500" />
                Смета расходов на компенсацию
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Название расхода</label>
                <input
                  type="text"
                  required
                  placeholder="Например: Оплата хостинга, Лицензии JetBrains..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl p-2.5 text-xs text-slate-800 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Сумма (₽)</label>
                  <input
                    type="number"
                    required
                    placeholder="Сумма выплат..."
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl p-2 text-xs text-slate-800 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Категория</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-650 outline-none"
                  >
                    <option value="Программное обеспечение (Software)">ПО и Лицензии</option>
                    <option value="Хозяйственные нужды (Office Supplies)">Офис и канцелярия</option>
                    <option value="Командировочные расходы (Travel)">Командировки</option>
                    <option value="Оборудование (Hardware)">Компьютеры и гаджеты</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Обоснование / Описание выплаты</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Добавьте детали, ссылки на чеки или обоснование необходимости расхода..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl p-2.5 text-xs text-slate-800 outline-none transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={createClaimMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {createClaimMutation.isPending ? 'Отправка...' : 'Отправить в бухгалтерию'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
