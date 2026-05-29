'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../hooks/useApi';
import { useAuthStore } from '../../store/authStore';
import { useState } from 'react';
import {
  Plus,
  X,
  User,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  FileText,
  Calendar
} from 'lucide-react';

export default function KanbanPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Create Task modal state
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ticketId, setTicketId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [deadline, setDeadline] = useState('');

  // Fetch Tasks
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await api.get('/tasks');
      return res.data;
    },
    enabled: !!user,
  });

  // Fetch Tickets (for linking)
  const { data: tickets } = useQuery({
    queryKey: ['tickets'],
    queryFn: async () => {
      const res = await api.get('/tickets');
      return res.data;
    },
    enabled: !!user,
  });

  // Fetch Roster (for assigning)
  const { data: roster } = useQuery({
    queryKey: ['roster'],
    queryFn: async () => {
      const res = await api.get('/users/roster');
      return res.data;
    },
    enabled: !!user,
  });

  // Create Task Mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/tasks', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsOpen(false);
      resetForm();
    },
  });

  // Update Task Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (data: { id: string; status: string }) => {
      const res = await api.put(`/tasks/${data.id}`, { status: data.status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTicketId('');
    setAssigneeId('');
    setDeadline('');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTaskMutation.mutate({
      title,
      description,
      ticketId: ticketId || undefined,
      assigneeId: assigneeId || undefined,
      deadline: deadline || undefined,
    });
  };

  // Columns Configuration
  const columns = [
    { title: 'К исполнению (To Do)', id: 'TODO', color: 'bg-slate-50 border-slate-200 text-slate-700' },
    { title: 'В работе (In Progress)', id: 'IN_PROGRESS', color: 'bg-blue-50/40 border-blue-100 text-blue-800' },
    { title: 'На проверке (Review)', id: 'REVIEW', color: 'bg-purple-50/40 border-purple-100 text-purple-800' },
    { title: 'Готово (Done)', id: 'DONE', color: 'bg-emerald-50/40 border-emerald-100 text-emerald-800' },
  ];

  const columnOrder = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];

  const getPreviousStatus = (currentStatus: string) => {
    const idx = columnOrder.indexOf(currentStatus);
    if (idx > 0) return columnOrder[idx - 1];
    return currentStatus;
  };

  const getNextStatus = (currentStatus: string) => {
    const idx = columnOrder.indexOf(currentStatus);
    if (idx < columnOrder.length - 1) return columnOrder[idx + 1];
    return currentStatus;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-slate-500 text-xs font-semibold">Жүктелуде...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in flex flex-col h-[calc(100vh-9rem)]">
      {/* Header Bar */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Жобаларды жоспарлау</span>
          <h2 className="text-xl font-bold text-slate-800 leading-tight">Тапсырмалар тақтасы (Kanban)</h2>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
        >
          <Plus size={15} />
          <span>Тапсырма қосу</span>
        </button>
      </div>

      {/* Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1 overflow-hidden h-full">
        {columns.map((col) => {
          const colTasks = tasks?.filter((t: any) => t.status === col.id) || [];
          return (
            <div key={col.id} className="flex flex-col border border-slate-200 bg-white rounded-2xl p-3 overflow-hidden h-full shadow-sm">
              {/* Column Header */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3 shrink-0">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">{col.title}</span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-650 rounded-full text-[10px] font-bold">
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks listing container */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {colTasks.map((task: any) => (
                  <div
                    key={task.id}
                    className="p-3 bg-slate-50/50 border border-slate-200 rounded-xl hover:border-slate-350 hover:bg-white shadow-sm transition-all flex flex-col justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 leading-snug">{task.title}</h4>
                      {task.description && (
                        <p className="text-[10px] text-slate-500 font-medium mt-1 leading-relaxed line-clamp-3">
                          {task.description}
                        </p>
                      )}

                      {/* Ticket association info */}
                      {task.ticket && (
                        <div className="mt-2.5 p-1.5 bg-white border border-slate-200 rounded-lg flex items-center gap-1.5 text-[9px] text-slate-500 font-bold">
                          <FileText size={10} className="text-slate-400" />
                          <span className="truncate">Өтінім: {task.ticket.title}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between">
                      {/* Assignee & Deadline Tags */}
                      <div className="flex flex-col gap-1 text-[9px] font-bold text-slate-400">
                        {task.assignee && (
                          <div className="flex items-center gap-1">
                            <User size={10} className="text-slate-400" />
                            <span className="text-slate-650">{task.assignee.firstName} {task.assignee.lastName}</span>
                          </div>
                        )}
                        {task.deadline && (
                          <div className="flex items-center gap-1">
                            <Calendar size={10} className="text-slate-400" />
                            <span className={new Date(task.deadline) < new Date() && task.status !== 'DONE' ? 'text-red-500 font-bold' : 'text-slate-500'}>
                              {new Date(task.deadline).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Column Navigation Controls */}
                      <div className="flex gap-1 shrink-0">
                        {col.id !== 'TODO' && (
                          <button
                            onClick={() =>
                              updateStatusMutation.mutate({
                                id: task.id,
                                status: getPreviousStatus(task.status),
                              })
                            }
                            className="p-1 hover:bg-slate-100 border border-slate-200 rounded text-slate-500 hover:text-slate-700 cursor-pointer"
                            title="Артқа жылжыту"
                          >
                            <ArrowLeft size={10} />
                          </button>
                        )}
                        {col.id !== 'DONE' && (
                          <button
                            onClick={() =>
                              updateStatusMutation.mutate({
                                id: task.id,
                                status: getNextStatus(task.status),
                              })
                            }
                            className="p-1 hover:bg-slate-100 border border-slate-200 rounded text-slate-500 hover:text-slate-700 cursor-pointer"
                            title="Алға жылжыту"
                          >
                            <ArrowRight size={10} />
                          </button>
                        )}
                        {col.id === 'DONE' && (
                          <span className="text-emerald-500 p-0.5">
                            <CheckCircle size={12} />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {colTasks.length === 0 && (
                  <div className="py-8 text-center text-slate-400 text-[10px] font-semibold italic">Бос</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE TASK DRAWER/MODAL */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-5 w-full max-w-md overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-4">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <Plus size={14} className="text-blue-500" />
                Жаңа тапсырма құру
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs font-bold text-slate-750">
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1">Тапсырма атауы</label>
                <input
                  type="text"
                  required
                  placeholder="Мақсатты анықтаңыз..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl p-2 text-xs text-slate-800 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1">Өтініммен байланыстыру (міндетті емес)</label>
                <select
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-600 outline-none"
                >
                  <option value="">Байланыстырмау</option>
                  {tickets?.map((t: any) => (
                    <option key={t.id} value={t.id}>#{t.id.slice(-5).toUpperCase()}: {t.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1">Жауапты қызметкер</label>
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-650 outline-none"
                  >
                    <option value="">Тағайындалмаған</option>
                    {roster?.map((r: any) => (
                      <option key={r.id} value={r.id}>{r.firstName} {r.lastName} ({r.role})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1">Орындау мерзімі</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-1.5 text-xs text-slate-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1">Қосымша сипаттама</label>
                <textarea
                  rows={3}
                  placeholder="Толық мәлімет немесе орындау қадамдары..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl p-2 text-xs text-slate-800 outline-none transition-all resize-none font-medium"
                />
              </div>

              <div className="flex gap-3 pt-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Бас тарту
                </button>
                <button
                  type="submit"
                  disabled={createTaskMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {createTaskMutation.isPending ? 'Құрылуда...' : 'Тапсырманы құру'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
