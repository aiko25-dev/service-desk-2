'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../hooks/useApi';
import { useAuthStore } from '../../store/authStore';
import { useState } from 'react';
import {
  Mail,
  Send,
  Plus,
  Inbox,
  User,
  Clock,
  X,
  CheckCheck,
  ChevronRight,
  MessageSquare
} from 'lucide-react';

export default function MessagesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Selected folder folder state ('inbox' | 'sent')
  const [folder, setFolder] = useState<'inbox' | 'sent'>('inbox');
  
  // Selected message state
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  // Compose Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [recipientId, setRecipientId] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');

  // Fetch Roster (recipients dropdown)
  const { data: roster } = useQuery({
    queryKey: ['roster'],
    queryFn: async () => {
      const res = await api.get('/users/roster');
      return res.data;
    },
    enabled: !!user,
  });

  // Fetch Folder Messages
  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages', folder],
    queryFn: async () => {
      const res = await api.get(`/messages/${folder}`);
      return res.data;
    },
    enabled: !!user,
  });

  // Send Message Mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/messages', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setIsOpen(false);
      resetForm();
    },
  });

  // Mark Message as Read Mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.put(`/messages/${id}/read`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['unreadMailCount'] });
    },
  });

  const resetForm = () => {
    setRecipientId('');
    setSubject('');
    setContent('');
  };

  const handleMessageClick = (msg: any) => {
    setSelectedMessageId(msg.id);
    if (folder === 'inbox' && !msg.isRead) {
      markAsReadMutation.mutate(msg.id);
    }
  };

  const handleSendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessageMutation.mutate({
      receiverId: recipientId,
      subject,
      body: content,
    });
  };

  const selectedMsg = messages?.find((m: any) => m.id === selectedMessageId);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-slate-400 text-sm">Загрузка переписки...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6 relative animate-fade-in">
      {/* LEFT COLUMN: Folders Navigation & Message List */}
      <div className="flex-1 flex flex-col min-w-0 premium-card p-5 h-full overflow-hidden justify-between">
        <div className="space-y-4 flex flex-col flex-1 overflow-hidden">
          {/* Header Action Tools */}
          <div className="flex justify-between items-center shrink-0">
            {/* Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
              <button
                onClick={() => {
                  setFolder('inbox');
                  setSelectedMessageId(null);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                  folder === 'inbox' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Inbox size={14} />
                <span>Входящие</span>
              </button>
              <button
                onClick={() => {
                  setFolder('sent');
                  setSelectedMessageId(null);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                  folder === 'sent' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Send size={14} />
                <span>Отправленные</span>
              </button>
            </div>

            <button
              onClick={() => setIsOpen(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
            >
              <Plus size={15} />
              <span>Написать</span>
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {messages?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                <Mail size={32} className="text-slate-300" />
                <span className="text-xs">Писем не найдено</span>
              </div>
            ) : (
              messages?.map((msg: any) => {
                const isSelected = selectedMessageId === msg.id;
                const contact = folder === 'inbox' ? msg.sender : msg.receiver;
                return (
                  <div
                    key={msg.id}
                    onClick={() => handleMessageClick(msg)}
                    className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 flex items-start gap-4 justify-between ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/20 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-1 overflow-hidden flex-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold mb-1">
                        <span className="text-slate-800 font-bold flex items-center gap-1.5">
                          <User size={12} className="text-slate-400" />
                          {contact?.firstName} {contact?.lastName} ({contact?.role})
                        </span>
                        <span>{new Date(msg.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      <h4 className={`text-xs truncate ${folder === 'inbox' && !msg.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                        {msg.subject}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium truncate max-w-[400px]">
                        {msg.body}
                      </p>
                    </div>

                    {/* Unread dot or Sent confirmation */}
                    <div className="shrink-0 pl-2">
                      {folder === 'inbox' && !msg.isRead && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full block animate-pulse mt-3" />
                      )}
                      {folder === 'sent' && (
                        <CheckCheck size={14} className="text-emerald-500 mt-2" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Message Viewer Pane */}
      {selectedMessageId && selectedMsg && (
        <div className="w-[450px] premium-card p-5 h-full overflow-hidden flex flex-col shrink-0 shadow-lg border-l border-slate-200 animate-fade-in z-20">
          <div className="flex flex-col flex-1 overflow-hidden space-y-4 justify-between">
            {/* Header Details */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Корпоративная переписка</span>
                <p className="text-xs font-bold text-slate-800">Сообщение</p>
              </div>
              <button
                onClick={() => setSelectedMessageId(null)}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Message Content */}
            <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-xs">
              <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex justify-between items-start text-[10px] text-slate-500 font-semibold border-b border-slate-200 pb-2">
                  <div className="space-y-0.5">
                    <span className="text-slate-400 block text-[9px] uppercase tracking-wider">От кого / Кому</span>
                    <span className="text-slate-800 font-bold">
                      {folder === 'inbox' ? (
                        `${selectedMsg.sender?.firstName} ${selectedMsg.sender?.lastName} (${selectedMsg.sender?.role})`
                      ) : (
                        `${selectedMsg.receiver?.firstName} ${selectedMsg.receiver?.lastName} (${selectedMsg.receiver?.role})`
                      )}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Дата</span>
                    <span className="text-slate-700 font-bold">{new Date(selectedMsg.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Тема</span>
                  <h3 className="font-bold text-slate-800 leading-snug">{selectedMsg.subject}</h3>
                </div>

                <div className="space-y-1 pt-3 border-t border-slate-200">
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider mb-1">Текст письма</span>
                  <p className="text-slate-600 font-medium whitespace-pre-line leading-relaxed text-[11px]">{selectedMsg.body}</p>
                </div>
              </div>
            </div>

            {/* Reply Button shortcut */}
            {folder === 'inbox' && (
              <div className="pt-3 border-t border-slate-100 shrink-0">
                <button
                  onClick={() => {
                    setRecipientId(selectedMsg.senderId);
                    setSubject(`Re: ${selectedMsg.subject}`);
                    setIsOpen(true);
                  }}
                  className="w-full py-2 bg-slate-900 text-slate-100 hover:bg-slate-800 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors text-xs"
                >
                  <MessageSquare size={14} />
                  <span>Ответить</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* COMPOSE MESSAGE MODAL */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 w-full max-w-md overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Plus size={16} className="text-blue-500" />
                Новое сообщение
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Получатель</label>
                <select
                  required
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-650 outline-none"
                >
                  <option value="">Выберите сотрудника...</option>
                  {roster
                    ?.filter((r: any) => r.id !== user?.id) // exclude self
                    ?.map((r: any) => (
                      <option key={r.id} value={r.id}>
                        {r.firstName} {r.lastName} ({r.role})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Тема</label>
                <input
                  type="text"
                  required
                  placeholder="Укажите тему обращения..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl p-2.5 text-xs text-slate-800 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Содержание</label>
                <textarea
                  required
                  rows={6}
                  placeholder="Напишите текст вашего сообщения..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
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
                  disabled={sendMessageMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {sendMessageMutation.isPending ? 'Отправка...' : 'Отправить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
