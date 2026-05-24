'use client';

import { usePathname } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { Bell, Mail, Search, Sparkles, Check, Trash2, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../hooks/useApi';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Polling unread mail count in backend
  const { data: mailData } = useQuery({
    queryKey: ['unreadMailCount'],
    queryFn: async () => {
      const res = await api.get('/messages/unread-count');
      return res.data;
    },
    enabled: !!user,
    refetchInterval: 15000, // Poll every 15 seconds
  });

  // Fetch pending approvals to show in notifications
  const { data: pendingApprovals } = useQuery({
    queryKey: ['pendingApprovalsCount'],
    queryFn: async () => {
      const res = await api.get('/approvals/pending');
      return res.data;
    },
    enabled: !!user,
    refetchInterval: 15000, // Poll every 15 seconds
  });

  // Initialize and update notifications
  useEffect(() => {
    if (!user) return;

    // Load custom notifications from localStorage or use defaults
    const stored = localStorage.getItem(`notifications_${user.id}`);
    let list = stored ? JSON.parse(stored) : [
      {
        id: 'welcome',
        title: 'Жүйеге қош келдіңіз!',
        description: 'Service Desk жүйесі сәтті орнатылды және қолдануға дайын.',
        time: 'Жаңа',
        read: false,
        type: 'info'
      },
      {
        id: 'guide',
        title: 'Vercel-ге орналастыру',
        description: 'Жобаны Vercel-ге орналастыру баптаулары сәтті жасалды.',
        time: 'Жаңа',
        read: false,
        type: 'success'
      }
    ];

    // Dynamically insert mail notification
    const unreadCount = mailData?.count || 0;
    if (unreadCount > 0) {
      const hasMail = list.some((n: any) => n.id === 'mail');
      if (!hasMail) {
        list = [
          {
            id: 'mail',
            title: 'Жаңа хаттар бар',
            description: `Сізде ${unreadCount} оқылмаған хат бар.`,
            time: 'Қазір',
            read: false,
            type: 'mail',
            link: '/messages'
          },
          ...list.filter((n: any) => n.id !== 'mail')
        ];
      } else {
        list = list.map((n: any) => n.id === 'mail' ? { ...n, description: `Сізде ${unreadCount} оқылмаған хат бар.`, read: false } : n);
      }
    } else {
      list = list.filter((n: any) => n.id !== 'mail');
    }

    // Dynamically insert pending approvals notification
    const approvalCount = pendingApprovals?.length || 0;
    if (approvalCount > 0) {
      const hasApprovals = list.some((n: any) => n.id === 'approvals');
      if (!hasApprovals) {
        list = [
          {
            id: 'approvals',
            title: 'Мақұлдауды күтуде',
            description: `Сізде мақұлдауды күтудегі ${approvalCount} сұраныс бар.`,
            time: 'Қазір',
            read: false,
            type: 'warning',
            link: '/approvals'
          },
          ...list.filter((n: any) => n.id !== 'approvals')
        ];
      } else {
        list = list.map((n: any) => n.id === 'approvals' ? { ...n, description: `Сізде мақұлдауды күтудегі ${approvalCount} сұраныс бар.`, read: false } : n);
      }
    } else {
      list = list.filter((n: any) => n.id !== 'approvals');
    }

    setNotifications(list);
    localStorage.setItem(`notifications_${user.id}`, JSON.stringify(list));
  }, [user, mailData, pendingApprovals]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    if (user) {
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updated));
    }
  };

  const markAsRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    if (user) {
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updated));
    }
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    if (user) {
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updated));
    }
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  if (!user) return null;

  // Title selector based on path
  const getHeaderTitle = () => {
    if (pathname.startsWith('/dashboard')) return 'Рабочий стол';
    if (pathname.startsWith('/tickets')) return 'Журнал заявок';
    if (pathname.startsWith('/kanban')) return 'Kanban доска задач';
    if (pathname.startsWith('/messages')) return 'Корпоративная почта';
    if (pathname.startsWith('/hr')) return 'Отдел кадров';
    if (pathname.startsWith('/finance')) return 'Финансовый департамент';
    if (pathname.startsWith('/approvals')) return 'Очередь согласования';
    if (pathname.startsWith('/admin')) return 'Администрирование';
    return 'Панель управления';
  };

  const unreadCount = mailData?.count || 0;

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 z-10">
      {/* Page Title Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold text-slate-800 tracking-tight">{getHeaderTitle()}</h1>
        {pathname === '/dashboard' && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Sparkles size={12} className="text-emerald-500" />
            Система активна
          </div>
        )}
      </div>

      {/* Action Tools */}
      <div className="flex items-center gap-4">
        {/* User context position tag */}
        {!pathname.startsWith('/login') && (
          <div className="hidden lg:flex flex-col items-end border-r border-slate-200 pr-4 text-xs">
            <span className="font-semibold text-slate-700">{user.position || 'Сотрудник'}</span>
            <span className="text-slate-400 font-medium">{user.department || 'Коллектив'}</span>
          </div>
        )}

        {/* Dynamic Mail Box Badge */}
        <Link
          href="/messages"
          className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-full transition-colors"
          title="Внутренняя почта"
        >
          <Mail size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white animate-pulse">
              {unreadCount}
            </span>
          )}
        </Link>

        {/* Dynamic Notifications Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-full transition-colors"
            title="Уведомления"
          >
            <Bell size={20} />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-blue-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white animate-pulse">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Dropdown panel */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl border border-slate-100 shadow-xl z-50 overflow-hidden transition-all duration-200 transform origin-top-right">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                <span className="font-semibold text-xs text-slate-800 uppercase tracking-wider">Хабарландырулар</span>
                {unreadNotificationsCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
                  >
                    <Check size={12} /> Барлығын оқу
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <Bell size={32} className="text-slate-300 mb-2" />
                    <p className="text-sm font-medium text-slate-500">Жаңа хабарландырулар жоқ</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`flex gap-3 p-4 hover:bg-slate-50/70 cursor-pointer transition-colors relative group ${
                        !n.read ? 'bg-blue-50/20' : ''
                      }`}
                    >
                      {/* Icon based on type */}
                      <div className="shrink-0 mt-0.5">
                        {n.type === 'warning' && <AlertCircle size={18} className="text-amber-500" />}
                        {n.type === 'success' && <CheckCircle size={18} className="text-emerald-500" />}
                        {n.type === 'info' && <Info size={18} className="text-blue-500" />}
                        {n.type === 'mail' && <Mail size={18} className="text-indigo-500" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className={`text-xs font-semibold truncate ${!n.read ? 'text-slate-800 font-bold' : 'text-slate-600'}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-slate-400 shrink-0 font-medium">{n.time}</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-normal">{n.description}</p>
                        
                        {n.link && (
                          <Link
                            href={n.link}
                            onClick={() => setIsOpen(false)}
                            className="inline-block mt-2 text-[11px] font-semibold text-blue-600 hover:underline"
                          >
                            Толығырақ көру &rarr;
                          </Link>
                        )}
                      </div>

                      {/* Delete / Action */}
                      <button
                        onClick={(e) => deleteNotification(n.id, e)}
                        className="absolute right-3 top-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-slate-100"
                        title="Өшіру"
                      >
                        <Trash2 size={12} />
                      </button>

                      {/* Unread Indicator Dot */}
                      {!n.read && (
                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-600 rounded-full" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
