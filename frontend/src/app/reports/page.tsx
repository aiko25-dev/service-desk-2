'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../../hooks/useApi';
import { useAuthStore } from '../../store/authStore';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { FileText, Download, Filter, RefreshCw, BarChart3, PieChartIcon } from 'lucide-react';

export default function ReportsPage() {
  const { user } = useAuthStore();

  // Filter states
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch Tickets based on filters
  const { data: tickets, isLoading, refetch } = useQuery({
    queryKey: ['reportTickets', status, priority, category, startDate, endDate],
    queryFn: async () => {
      const params: any = {};
      if (status) params.status = status;
      if (priority) params.priority = priority;
      if (category) params.category = category;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get('/tickets', { params });
      return res.data;
    },
    enabled: !!user,
  });

  const handleExport = async () => {
    try {
      const params: any = {};
      if (status) params.status = status;
      if (priority) params.priority = priority;
      if (category) params.category = category;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get('/tickets/export', {
        params,
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `service_desk_report_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export tickets:', error);
      alert('Есепті жүктеу кезінде қате орын алды');
    }
  };

  // Dynamic Chart Data Processing
  const getStatusChartData = () => {
    if (!tickets) return [];
    const counts: Record<string, number> = {};
    tickets.forEach((t: any) => {
      const s = t.status;
      counts[s] = (counts[s] || 0) + 1;
    });
    
    const statusMap: Record<string, string> = {
      NEW: 'Новая',
      ACCEPTED: 'Принята',
      IN_PROGRESS: 'В работе',
      PENDING_APPROVAL: 'Согласование',
      CLOSED: 'Закрыта',
      REJECTED: 'Отклонена',
    };

    return Object.keys(counts).map((key) => ({
      name: statusMap[key] || key,
      value: counts[key],
    }));
  };

  const getPriorityChartData = () => {
    if (!tickets) return [];
    const counts: Record<string, number> = {};
    tickets.forEach((t: any) => {
      const p = t.priority;
      counts[p] = (counts[p] || 0) + 1;
    });
    return Object.keys(counts).map((key) => ({
      name: key,
      value: counts[key],
    }));
  };

  const statusData = getStatusChartData();
  const priorityData = getPriorityChartData();

  const COLORS = ['#0052cc', '#36b37e', '#ffab00', '#ff5630', '#6554c0', '#00b8d9'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-[#dfe1e6] pb-4 shrink-0">
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Корпоративтік талдау</span>
          <h2 className="text-xl font-bold text-slate-800 leading-tight">Талдау және Есептер (Reports)</h2>
        </div>
        
        <button
          onClick={handleExport}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
        >
          <Download size={15} />
          <span>Excel форматында жүктеу</span>
        </button>
      </div>

      {/* Filter panel */}
      <div className="premium-card p-4 space-y-4 bg-white border border-[#dfe1e6]">
        <h3 className="text-xs font-bold text-slate-700 flex items-center gap-2">
          <Filter size={14} className="text-blue-500" />
          Сүзгілер (Filters)
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs font-semibold text-slate-700">
          <div>
            <label className="block text-[9px] uppercase text-slate-450 mb-1">Статус</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-650 outline-none"
            >
              <option value="">Барлығы</option>
              <option value="NEW">Новая</option>
              <option value="ACCEPTED">Принята</option>
              <option value="IN_PROGRESS">В работе</option>
              <option value="PENDING_APPROVAL">Согласование</option>
              <option value="CLOSED">Закрыта</option>
              <option value="REJECTED">Отклонена</option>
            </select>
          </div>

          <div>
            <label className="block text-[9px] uppercase text-slate-450 mb-1">Маңыздылығы</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-650 outline-none"
            >
              <option value="">Барлығы</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </select>
          </div>

          <div>
            <label className="block text-[9px] uppercase text-slate-450 mb-1">Санат</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-650 outline-none"
            >
              <option value="">Барлығы</option>
              <option value="Техническая поддержка">Тех. поддержка</option>
              <option value="Программное обеспечение">ПО (Software)</option>
              <option value="Закупки оборудования">Закупка оборудования</option>
              <option value="HR & Отпуска">HR & Отпуска</option>
              <option value="Хозяйственные нужды">Хоз. нужды</option>
            </select>
          </div>

          <div>
            <label className="block text-[9px] uppercase text-slate-450 mb-1">Басталу күні</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-650 outline-none"
            />
          </div>

          <div>
            <label className="block text-[9px] uppercase text-slate-450 mb-1">Аяқталу күні</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-650 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Analytics Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="premium-card p-5 bg-white border border-[#dfe1e6] flex flex-col min-h-[300px]">
          <h3 className="text-xs font-bold text-slate-800 mb-4 flex items-center gap-2">
            <BarChart3 size={15} className="text-blue-500" />
            Өтінімдердің статустар бойынша таралуы
          </h3>
          <div className="h-56 w-full flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">Жүктелуде...</div>
            ) : statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Bar dataKey="value" fill="#0052cc" radius={[4, 4, 0, 0]}>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">Мәліметтер жоқ</div>
            )}
          </div>
        </div>

        {/* Priority distribution */}
        <div className="premium-card p-5 bg-white border border-[#dfe1e6] flex flex-col min-h-[300px]">
          <h3 className="text-xs font-bold text-slate-800 mb-4 flex items-center gap-2">
            <PieChartIcon size={15} className="text-purple-500" />
            Өтінімдердің маңыздылық деңгейі (Priority)
          </h3>
          <div className="h-56 w-full flex-1 flex items-center justify-center">
            {isLoading ? (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">Жүктелуде...</div>
            ) : priorityData.length > 0 ? (
              <div className="flex items-center justify-between w-full h-full px-6">
                <div className="h-full w-2/3">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={priorityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {priorityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-2 w-1/3 text-[10px] font-bold text-slate-500">
                  {priorityData.map((d, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[(idx + 2) % COLORS.length] }} />
                      <span className="truncate">{d.name}: {d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">Мәліметтер жоқ</div>
            )}
          </div>
        </div>
      </div>

      {/* Reports Summary Table */}
      <div className="premium-card p-5 bg-white border border-[#dfe1e6]">
        <h3 className="text-xs font-bold text-slate-800 mb-4 flex items-center gap-2">
          <FileText size={15} className="text-blue-500" />
          Сүзгіден өткен өтінімдер тізімі
        </h3>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-450 border-b border-slate-200 pb-2.5 font-bold">
                <th className="py-2.5">ID өтінім</th>
                <th className="py-2.5">Тақырыбы</th>
                <th className="py-2.5">Санаты</th>
                <th className="py-2.5">Жауапты</th>
                <th className="py-2.5">Маңыздылығы</th>
                <th className="py-2.5">Статусы</th>
                <th className="py-2.5">Тіркелген күні</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">Жүктелуде...</td>
                </tr>
              ) : tickets?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">Өтінімдер табылмады</td>
                </tr>
              ) : (
                tickets?.map((ticket: any) => (
                  <tr key={ticket.id} className="hover:bg-slate-50/50">
                    <td className="py-3 font-semibold text-slate-800">#{ticket.id.slice(-5).toUpperCase()}</td>
                    <td className="py-3 font-semibold max-w-[200px] truncate text-slate-900">{ticket.title}</td>
                    <td className="py-3 text-slate-500">{ticket.category}</td>
                    <td className="py-3 text-slate-500">
                      {ticket.assignee ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}` : 'Тағайындалмаған'}
                    </td>
                    <td className="py-3">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        ticket.priority === 'HIGH' ? 'text-red-650' : ticket.priority === 'MEDIUM' ? 'text-amber-600' : 'text-slate-400'
                      }`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        ticket.status === 'CLOSED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' : 'bg-blue-50 text-blue-700 border border-blue-150'
                      }`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400 font-bold">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
