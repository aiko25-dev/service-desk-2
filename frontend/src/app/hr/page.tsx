'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../hooks/useApi';
import { useAuthStore } from '../../store/authStore';
import { useState } from 'react';
import {
  Users,
  Calendar,
  FileText,
  Plus,
  X,
  CheckCircle,
  Clock,
  User,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

export default function HrPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [tab, setTab] = useState<'vacation' | 'orders'>('vacation');
  
  // Vacation Modal
  const [isVacationOpen, setIsVacationOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  // Order Modal
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [orderTitle, setOrderTitle] = useState('');
  const [orderType, setOrderType] = useState('HIRE');
  const [orderContent, setOrderContent] = useState('');
  const [targetEmployeeId, setTargetEmployeeId] = useState('');

  // Fetch Vacations
  const { data: vacations, isLoading: isLoadingVacations } = useQuery({
    queryKey: ['vacations'],
    queryFn: async () => {
      const res = await api.get('/hr/vacations');
      return res.data;
    },
    enabled: !!user,
  });

  // Fetch Orders (HR, Managers, Admin only)
  const { data: orders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['hrOrders'],
    queryFn: async () => {
      if (user?.role !== 'HR' && user?.role !== 'MANAGER' && user?.role !== 'ADMIN') return [];
      const res = await api.get('/hr/orders');
      return res.data;
    },
    enabled: !!user && (user?.role === 'HR' || user?.role === 'MANAGER' || user?.role === 'ADMIN'),
  });

  // Fetch Roster
  const { data: roster } = useQuery({
    queryKey: ['roster'],
    queryFn: async () => {
      const res = await api.get('/users/roster');
      return res.data;
    },
    enabled: !!user,
  });

  // Create Vacation Mutation
  const createVacationMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/hr/vacations', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacations'] });
      setIsVacationOpen(false);
      resetVacationForm();
    },
  });

  // Create Order Mutation
  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/hr/orders', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrOrders'] });
      setIsOrderOpen(false);
      resetOrderForm();
    },
  });

  const resetVacationForm = () => {
    setStartDate('');
    setEndDate('');
    setReason('');
  };

  const resetOrderForm = () => {
    setOrderTitle('');
    setOrderType('HIRE');
    setOrderContent('');
    setTargetEmployeeId('');
  };

  const handleVacationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createVacationMutation.mutate({ startDate, endDate, reason });
  };

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOrderMutation.mutate({
      title: orderTitle,
      type: orderType,
      content: orderContent,
      employeeId: targetEmployeeId || undefined,
    });
  };

  const statusMap: Record<string, string> = {
    PENDING: 'На согласовании',
    APPROVED: 'Согласован',
    REJECTED: 'Отклонен',
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-purple-50 text-purple-700 border-purple-200',
    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const orderTypeMap: Record<string, string> = {
    HIRE: 'Прием на работу',
    TERMINATION: 'Увольнение',
    TRANSFER: 'Перевод сотрудника',
  };

  const canViewOrders = user?.role === 'HR' || user?.role === 'MANAGER' || user?.role === 'ADMIN';

  return (
    <div className="space-y-6 animate-fade-in flex flex-col h-[calc(100vh-8rem)]">
      {/* Header with folder Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 shrink-0">
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 self-start">
          <button
            onClick={() => setTab('vacation')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
              tab === 'vacation' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar size={14} />
            <span>Заявления на отпуск</span>
          </button>
          {canViewOrders && (
            <button
              onClick={() => setTab('orders')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                tab === 'orders' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText size={14} />
              <span>Кадровые приказы</span>
            </button>
          )}
        </div>

        {tab === 'vacation' ? (
          <button
            onClick={() => setIsVacationOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
          >
            <Plus size={15} />
            <span>Запросить отпуск</span>
          </button>
        ) : (
          user?.role === 'HR' && (
            <button
              onClick={() => setIsOrderOpen(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
            >
              <Plus size={15} />
              <span>Создать приказ</span>
            </button>
          )
        )}
      </div>

      {/* Content panel */}
      <div className="flex-1 overflow-hidden h-full">
        {tab === 'vacation' ? (
          <div className="premium-card p-5 h-full overflow-hidden flex flex-col justify-between">
            <div className="flex flex-col flex-1 overflow-hidden">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 shrink-0">
                <Users size={16} className="text-blue-500" />
                Журнал отпусков сотрудников
              </h3>

              <div className="flex-1 overflow-y-auto pr-1">
                {isLoadingVacations ? (
                  <div className="text-center py-12 text-slate-400 text-xs">Загрузка заявлений...</div>
                ) : vacations?.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">Заявления отсутствуют</div>
                ) : (
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-100 pb-2">
                          <th className="py-2.5 font-semibold">Сотрудник</th>
                          <th className="py-2.5 font-semibold">Начало</th>
                          <th className="py-2.5 font-semibold">Конец</th>
                          <th className="py-2.5 font-semibold">Причина</th>
                          <th className="py-2.5 font-semibold">Статус</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                        {vacations?.map((vac: any) => (
                          <tr key={vac.id} className="hover:bg-slate-50/50">
                            <td className="py-3 font-semibold text-slate-800">
                              {vac.employee.firstName} {vac.employee.lastName}
                            </td>
                            <td className="py-3 text-slate-500">{new Date(vac.startDate).toLocaleDateString()}</td>
                            <td className="py-3 text-slate-500">{new Date(vac.endDate).toLocaleDateString()}</td>
                            <td className="py-3 max-w-[200px] truncate text-slate-500" title={vac.reason}>{vac.reason || '—'}</td>
                            <td className="py-3">
                              <span className={`px-2.5 py-0.5 border rounded-full text-[9px] font-bold ${statusColors[vac.status]}`}>
                                {statusMap[vac.status] || vac.status}
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
        ) : (
          <div className="premium-card p-5 h-full overflow-hidden flex flex-col justify-between">
            <div className="flex flex-col flex-1 overflow-hidden">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 shrink-0">
                <FileSpreadsheet size={16} className="text-teal-500" />
                Кадровые распоряжения и приказы
              </h3>

              <div className="flex-1 overflow-y-auto pr-1">
                {isLoadingOrders ? (
                  <div className="text-center py-12 text-slate-400 text-xs">Загрузка приказов...</div>
                ) : orders?.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">Приказы отсутствуют</div>
                ) : (
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-100 pb-2">
                          <th className="py-2.5 font-semibold">Название</th>
                          <th className="py-2.5 font-semibold">Тип приказа</th>
                          <th className="py-2.5 font-semibold">Сотрудник</th>
                          <th className="py-2.5 font-semibold">Содержание</th>
                          <th className="py-2.5 font-semibold">Статус</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                        {orders?.map((ord: any) => (
                          <tr key={ord.id} className="hover:bg-slate-50/50">
                            <td className="py-3 font-semibold text-slate-800">{ord.title}</td>
                            <td className="py-3 text-slate-500">{orderTypeMap[ord.type] || ord.type}</td>
                            <td className="py-3 text-slate-500">
                              {ord.employee ? `${ord.employee.firstName} ${ord.employee.lastName}` : '—'}
                            </td>
                            <td className="py-3 max-w-[200px] truncate text-slate-500" title={ord.content}>{ord.content}</td>
                            <td className="py-3">
                              <span className={`px-2.5 py-0.5 border rounded-full text-[9px] font-bold ${statusColors[ord.status]}`}>
                                {statusMap[ord.status] || ord.status}
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
        )}
      </div>

      {/* VACATION BOOKING MODAL */}
      {isVacationOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 w-full max-w-md overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Plus size={16} className="text-blue-500" />
                Подать заявление на отпуск
              </h3>
              <button
                onClick={() => setIsVacationOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleVacationSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Дата начала</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Дата окончания</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Причина/Комментарий (необязательно)</label>
                <textarea
                  rows={3}
                  placeholder="Например: Ежегодный оплачиваемый отпуск..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl p-2.5 text-xs text-slate-800 outline-none transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsVacationOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={createVacationMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {createVacationMutation.isPending ? 'Отправка...' : 'Отправить заявление'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE HR ORDER MODAL */}
      {isOrderOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 w-full max-w-md overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Plus size={16} className="text-blue-500" />
                Сформировать приказ
              </h3>
              <button
                onClick={() => setIsOrderOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleOrderSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Название приказа</label>
                <input
                  type="text"
                  required
                  placeholder="Например: Приказ о приеме на работу Иванова..."
                  value={orderTitle}
                  onChange={(e) => setOrderTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl p-2.5 text-xs text-slate-800 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Тип приказа</label>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-600 outline-none"
                  >
                    <option value="HIRE">Прием на работу (HIRE)</option>
                    <option value="TRANSFER">Перевод сотрудника (TRANSFER)</option>
                    <option value="TERMINATION">Увольнение (TERMINATION)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Сотрудник</label>
                  <select
                    required
                    value={targetEmployeeId}
                    onChange={(e) => setTargetEmployeeId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-650 outline-none"
                  >
                    <option value="">Выберите сотрудника...</option>
                    {roster?.map((r: any) => (
                      <option key={r.id} value={r.id}>{r.firstName} {r.lastName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Содержание/Формулировка приказа</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Введите официальное обоснование распоряжения..."
                  value={orderContent}
                  onChange={(e) => setOrderContent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl p-2.5 text-xs text-slate-800 outline-none transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsOrderOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={createOrderMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {createOrderMutation.isPending ? 'Формирование...' : 'Сформировать приказ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
