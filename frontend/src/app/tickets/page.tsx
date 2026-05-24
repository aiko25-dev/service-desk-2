'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../hooks/useApi';
import { useAuthStore } from '../../store/authStore';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  Plus,
  Download,
  X,
  FileIcon,
  MessageSquare,
  Clock,
  User,
  Check,
  CornerDownRight,
  UploadCloud,
  Loader2
} from 'lucide-react';

export default function TicketsPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();

  // Active ticket selection (opens side detail panel)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  
  // Filter States
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');
  
  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Техническая поддержка');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  
  // File upload states
  const [uploadedFiles, setUploadedFiles] = useState<{ id: string; name: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // New comment state
  const [commentText, setCommentText] = useState('');
  
  // Status transition comment
  const [statusComment, setStatusComment] = useState('');
  const [isStatusChanging, setIsStatusChanging] = useState(false);
  const [newStatusValue, setNewStatusValue] = useState('');

  // Check URL params for pre-selected ticket (e.g. from Dashboard click)
  useEffect(() => {
    const ticketId = searchParams.get('id');
    if (ticketId) {
      setSelectedTicketId(ticketId);
    }
  }, [searchParams]);

  // Fetch Tickets
  const { data: tickets, isLoading } = useQuery({
    queryKey: ['tickets', { status, priority, category, search }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (priority) params.append('priority', priority);
      if (category) params.append('category', category);
      if (search) params.append('search', search);

      const res = await api.get(`/tickets?${params.toString()}`);
      return res.data;
    },
    enabled: !!user,
  });

  // Fetch Categories
  const { data: categories } = useQuery({
    queryKey: ['adminCategories'],
    queryFn: async () => {
      const res = await api.get('/admin/categories');
      return res.data;
    },
    enabled: !!user,
  });

  // Fetch Selected Ticket details
  const { data: ticketDetails } = useQuery({
    queryKey: ['ticket', selectedTicketId],
    queryFn: async () => {
      if (!selectedTicketId) return null;
      const res = await api.get(`/tickets/${selectedTicketId}`);
      return res.data;
    },
    enabled: !!selectedTicketId,
  });

  // --- Mutations ---
  
  // Create Ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/tickets', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setIsCreateOpen(false);
      resetCreateForm();
    },
  });

  // Add Comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!selectedTicketId) return;
      const res = await api.post(`/tickets/${selectedTicketId}/comments`, { text });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', selectedTicketId] });
      setCommentText('');
    },
  });

  // Change Ticket Status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (data: { status: string; comment?: string }) => {
      if (!selectedTicketId) return;
      const res = await api.put(`/tickets/${selectedTicketId}/status`, {
        status: data.status,
        comment: data.comment,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', selectedTicketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setIsStatusChanging(false);
      setStatusComment('');
    },
  });

  // Accept Ticket mutation (Operator action)
  const acceptTicketMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTicketId) return;
      const res = await api.put(`/tickets/${selectedTicketId}/accept`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', selectedTicketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  // --- Handlers ---
  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/storage/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadedFiles((prev) => [...prev, { id: res.data.id, name: res.data.name }]);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Ошибка загрузки файла');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTicketMutation.mutate({
      title: newTitle,
      description: newDesc,
      category: newCategory,
      priority: newPriority,
      fileIds: uploadedFiles.map((f) => f.id),
    });
  };

  const resetCreateForm = () => {
    setNewTitle('');
    setNewDesc('');
    setNewCategory('Техническая поддержка');
    setNewPriority('MEDIUM');
    setUploadedFiles([]);
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (priority) params.append('priority', priority);
      if (category) params.append('category', category);
      if (search) params.append('search', search);

      const response = await api.get(`/tickets/export?${params.toString()}`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tickets_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export tickets:', error);
      alert('Ошибка при экспорте заявок');
    }
  };

  const handleCloseDrawer = () => {
    setSelectedTicketId(null);
    // remove ?id from url
    router.replace('/tickets');
  };

  const statusMap: Record<string, string> = {
    NEW: 'Новая',
    ACCEPTED: 'Принята',
    IN_PROGRESS: 'В работе',
    PENDING_APPROVAL: 'На согласовании',
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

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6 relative animate-fade-in">
      {/* LEFT PANEL: Tickets List & Filters */}
      <div className="flex-1 flex flex-col min-w-0 premium-card p-5 h-full overflow-hidden justify-between">
        <div className="space-y-4 flex flex-col flex-1 overflow-hidden">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch justify-between shrink-0">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute inset-y-0 left-3 my-auto text-slate-400 shrink-0" size={16} />
              <input
                type="text"
                placeholder="Поиск по теме и описанию..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-2 pl-10 pr-4 text-xs font-medium text-slate-800 outline-none transition-all"
              />
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                title="Экспорт отчета в Excel"
              >
                <Download size={15} />
                <span>Экспорт</span>
              </button>

              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
              >
                <Plus size={15} />
                <span>Создать заявку</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 shrink-0">
            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-600 outline-none"
            >
              <option value="">Все статусы</option>
              {Object.keys(statusMap).map((s) => (
                <option key={s} value={s}>{statusMap[s]}</option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-600 outline-none"
            >
              <option value="">Все приоритеты</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </select>

            {/* Category Filter */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-600 outline-none col-span-2 md:col-span-1"
            >
              <option value="">Все категории</option>
              {categories?.map((c: any) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Tickets list */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {isLoading ? (
              <div className="flex justify-center items-center py-20 text-slate-400 text-xs">Загрузка заявок...</div>
            ) : tickets?.length === 0 ? (
              <div className="flex justify-center items-center py-20 text-slate-400 text-xs">Заявки не найдены</div>
            ) : (
              tickets?.map((t: any) => {
                const isSelected = selectedTicketId === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/20 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1.5 overflow-hidden">
                        <h4 className="text-xs font-bold text-slate-800 truncate">{t.title}</h4>
                        <p className="text-[10px] text-slate-400 font-medium truncate max-w-[400px]">
                          {t.description}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 border rounded-full text-[9px] font-bold shrink-0 ${statusColors[t.status]}`}>
                        {statusMap[t.status] || t.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-semibold">
                      <div className="flex items-center gap-3">
                        <span className={`font-extrabold tracking-wider ${
                          t.priority === 'HIGH' ? 'text-red-500' : t.priority === 'MEDIUM' ? 'text-amber-500' : 'text-slate-400'
                        }`}>
                          {t.priority}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span>{t.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User size={12} />
                        <span className="truncate max-w-[100px]">{t.creator.firstName} {t.creator.lastName}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Interactive Ticket Details Drawer */}
      {selectedTicketId && ticketDetails && (
        <div className="w-[450px] premium-card p-5 h-full overflow-hidden flex flex-col justify-between shrink-0 shadow-lg border-l border-slate-200 animate-fade-in z-20">
          <div className="flex flex-col flex-1 overflow-hidden space-y-4">
            {/* Header Toolbar */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Карточка заявки</span>
                <p className="text-xs font-bold text-slate-800 truncate max-w-[300px]">#{ticketDetails.id.slice(-6).toUpperCase()}</p>
              </div>
              <button
                onClick={handleCloseDrawer}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable details */}
            <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-xs">
              {/* Ticket Details Panel */}
              <div className="space-y-2.5 bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="font-bold text-slate-800 leading-tight">{ticketDetails.title}</h3>
                  <span className={`px-2.5 py-0.5 border rounded-full text-[9px] font-extrabold shrink-0 ${statusColors[ticketDetails.status]}`}>
                    {statusMap[ticketDetails.status] || ticketDetails.status}
                  </span>
                </div>
                <p className="text-slate-600 font-medium whitespace-pre-line leading-relaxed">{ticketDetails.description}</p>
                
                <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-semibold">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase tracking-wider mb-0.5">Создатель</span>
                    <span className="text-slate-700 font-bold">{ticketDetails.creator.firstName} {ticketDetails.creator.lastName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase tracking-wider mb-0.5">Категория / Степень</span>
                    <span className="text-slate-700 font-bold">{ticketDetails.category} / {ticketDetails.priority}</span>
                  </div>
                </div>
              </div>

              {/* Action Toolbar for Operators */}
              {(user?.role === 'OPERATOR' || user?.role === 'ADMIN') && (
                <div className="bg-slate-900 text-slate-100 rounded-xl p-4 space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Действия с заявкой</span>
                  
                  <div className="flex flex-col gap-2">
                    {/* Operator Accept action */}
                    {ticketDetails.status === 'NEW' && (
                      <button
                        onClick={() => acceptTicketMutation.mutate()}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors text-xs"
                      >
                        <Check size={16} />
                        <span>Принять в работу</span>
                      </button>
                    )}

                    {/* Change Status Dropdown */}
                    <div className="flex gap-2">
                      <select
                        value={newStatusValue || ticketDetails.status}
                        onChange={(e) => {
                          setNewStatusValue(e.target.value);
                          setIsStatusChanging(true);
                        }}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs font-bold text-white outline-none"
                      >
                        {Object.keys(statusMap).map((s) => (
                          <option key={s} value={s}>{statusMap[s]}</option>
                        ))}
                      </select>
                    </div>

                    {isStatusChanging && (
                      <div className="space-y-2 mt-2 pt-2 border-t border-slate-800 animate-fade-in">
                        <textarea
                          placeholder="Причина смены статуса (комментарий)..."
                          value={statusComment}
                          onChange={(e) => setStatusComment(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-600 outline-none h-16"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setIsStatusChanging(false)}
                            className="px-3 py-1 bg-slate-800 hover:bg-slate-750 text-slate-400 rounded-lg text-[10px] font-bold"
                          >
                            Отмена
                          </button>
                          <button
                            onClick={() => updateStatusMutation.mutate({ status: newStatusValue, comment: statusComment })}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold"
                          >
                            Сменить статус
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Attachments Section */}
              {ticketDetails.files && ticketDetails.files.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Вложения ({ticketDetails.files.length})</span>
                  <div className="space-y-1.5">
                    {ticketDetails.files.map((file: any) => (
                      <a
                        key={file.id}
                        href={`http://localhost:3001${file.url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-medium text-slate-700 text-[11px]"
                      >
                        <div className="flex items-center gap-2 overflow-hidden mr-3">
                          <FileIcon size={14} className="text-slate-400 shrink-0" />
                          <span className="truncate">{file.name}</span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-semibold shrink-0">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments Feed Thread */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block flex items-center gap-1.5">
                  <MessageSquare size={13} />
                  История и обсуждение
                </span>

                {/* List Comments */}
                <div className="space-y-3">
                  {ticketDetails.comments?.map((comment: any) => {
                    const isSystem = comment.text.startsWith('[Система]') || comment.text.startsWith('[Согласование]');
                    return (
                      <div key={comment.id} className={`p-3 rounded-xl ${isSystem ? 'bg-slate-100 border border-slate-200' : 'bg-slate-50'}`}>
                        <div className="flex justify-between items-center text-[9px] text-slate-400 font-semibold mb-1">
                          <span className="text-slate-700 font-bold">{comment.author.firstName} {comment.author.lastName}</span>
                          <span>{new Date(comment.createdAt).toLocaleDateString()} {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className={`text-[11px] leading-relaxed ${isSystem ? 'text-slate-500 font-semibold' : 'text-slate-700 font-medium'}`}>{comment.text}</p>
                      </div>
                    );
                  })}
                  {(!ticketDetails.comments || ticketDetails.comments.length === 0) && (
                    <div className="py-4 text-center text-slate-400 text-[10px]">История пуста</div>
                  )}
                </div>
              </div>
            </div>

            {/* Comment Input Footer */}
            <div className="pt-3 border-t border-slate-100 shrink-0 flex gap-2">
              <input
                type="text"
                placeholder="Напишите комментарий..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addCommentMutation.mutate(commentText);
                  }
                }}
                className="flex-1 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none transition-all"
              />
              <button
                onClick={() => addCommentMutation.mutate(commentText)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Отправить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE TICKET MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Plus size={16} className="text-blue-500" />
                Новое обращение в Service Desk
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Тема обращения</label>
                <input
                  type="text"
                  required
                  placeholder="Опишите проблему кратко..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl p-2.5 text-xs text-slate-800 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Категория</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-600 outline-none"
                  >
                    {categories?.map((c: any) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Приоритет</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-600 outline-none"
                  >
                    <option value="LOW">Низкий (LOW)</option>
                    <option value="MEDIUM">Средний (MEDIUM)</option>
                    <option value="HIGH">Высокий (HIGH)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Подробное описание проблемы</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Укажите подробности: ошибки, шаги воспроизведения..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl p-2.5 text-xs text-slate-800 outline-none transition-all resize-none"
                />
              </div>

              {/* Drag-n-drop Upload Mockup Container */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1.5">Вложения (макс 50МБ)</label>
                <div className="relative border border-dashed border-slate-300 rounded-xl hover:border-slate-400 transition-colors p-4 flex flex-col items-center justify-center bg-slate-50/50">
                  <input
                    type="file"
                    id="file-upload"
                    onChange={handleUploadFile}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isUploading}
                  />
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-1">
                      <Loader2 className="animate-spin text-blue-500" size={24} />
                      <span className="text-[10px] text-slate-500 font-semibold">Загрузка файла...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <UploadCloud className="text-slate-400" size={24} />
                      <span className="text-[10px] text-slate-500 font-semibold">Нажмите для выбора файла</span>
                    </div>
                  )}
                </div>

                {/* Uploaded Files roster */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-2.5 space-y-1">
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="flex justify-between items-center p-2 bg-slate-100 rounded-lg text-[10px] text-slate-600">
                        <span className="truncate max-w-[300px]">{file.name}</span>
                        <Check size={12} className="text-emerald-500 shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={createTicketMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {createTicketMutation.isPending ? 'Создание...' : 'Отправить обращение'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
