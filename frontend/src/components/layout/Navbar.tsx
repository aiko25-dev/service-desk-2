'use client';

import { usePathname } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { Bell, Mail, Sparkles, Check, Trash2, AlertCircle, Info, CheckCircle, ChevronDown, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../hooks/useApi';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, updateUser } = useAuthStore();

  const [isOpen, setIsOpen] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);
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
      if (user?.role !== 'MANAGER' && user?.role !== 'ADMIN') return [];
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
        list = list.map((n: any) => n.id === 'approvals' ? { ...n, description: `Сізде maқұлдауды күтудегі ${approvalCount} сұраныс бар.`, read: false } : n);
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
      if (roleRef.current && !roleRef.current.contains(event.target as Node)) {
        setShowRoleMenu(false);
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
    if (pathname.startsWith('/dashboard')) return 'Бақылау панелі (Dashboard)';
    if (pathname.startsWith('/tickets')) return 'Өтінімдер журналы (Tickets)';
    if (pathname.startsWith('/tasks')) return 'Тапсырмалар тізімі (Tasks)';
    if (pathname.startsWith('/kanban')) return 'Kanban тақтасы';
    if (pathname.startsWith('/reports')) return 'Талдау және Есептер (Reports)';
    if (pathname.startsWith('/messages')) return 'Корпоративтік хат алмасу';
    if (pathname.startsWith('/hr')) return 'HR департаменті';
    if (pathname.startsWith('/finance')) return 'Бухгалтерия және Шығындар';
    if (pathname.startsWith('/employees')) return 'Қызметкерлер тізімі (Employees)';
    if (pathname.startsWith('/approvals')) return 'Құжаттарды мақұлдау (Approvals)';
    if (pathname.startsWith('/files')) return 'Файлдар архиві (Files)';
    if (pathname.startsWith('/admin')) return 'Жүйені әкімшілендіру (Admin)';
    if (pathname.startsWith('/settings')) return 'Платформа баптаулары (Settings)';
    return 'Басқару панелі';
  };

  const unreadCount = mailData?.count || 0;

  const rolesList = [
    { key: 'ADMIN', label: 'ADMIN (Әкімші)' },
    { key: 'MANAGER', label: 'MANAGER (Жетекші)' },
    { key: 'OPERATOR', label: 'OPERATOR (Оператор)' },
    { key: 'HR', label: 'HR (Кадрлар)' },
    { key: 'ACCOUNTANT', label: 'ACCOUNTANT (Бухгалтер)' },
  ];

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-50 text-red-700 border-red-200';
      case 'MANAGER': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'OPERATOR': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'HR': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'ACCOUNTANT': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <header className="h-16 border-b border-[#dfe1e6] bg-white flex items-center justify-between px-6 shrink-0 z-10">
      {/* Page Title Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-sm md:text-base font-bold text-slate-800 tracking-tight">{getHeaderTitle()}</h1>
        <div className="hidden md:flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
          <Sparkles size={10} className="text-blue-500" />
          Жүйе белсенді
        </div>
      </div>

      {/* Action Tools */}
      <div className="flex items-center gap-4">
        
        {/* Dynamic Role Switcher for Testing */}
        <div className="relative" ref={roleRef}>
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#dfe1e6] hover:border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100/50 text-[10px] font-bold text-slate-700 transition-all cursor-pointer"
          >
            <Shield size={12} className="text-blue-600" />
            <span>Роль:</span>
            <span className={`px-1.5 py-0.5 rounded uppercase ${getRoleBadgeStyle(user.role)}`}>
              {user.role}
            </span>
            <ChevronDown size={12} className="text-slate-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl border border-slate-200 shadow-lg z-50 overflow-hidden py-1">
              <div className="px-3 py-1.5 border-b border-slate-100 text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                Тестілеуге рөл таңдаңыз:
              </div>
              {rolesList.map((r) => (
                <button
                  key={r.key}
                  onClick={() => {
                    updateUser({ role: r.key as any });
                    setShowRoleMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 flex items-center justify-between transition-colors ${
                    user.role === r.key ? 'text-blue-600 bg-blue-50/30' : 'text-slate-650'
                  }`}
                >
                  <span>{r.label}</span>
                  {user.role === r.key && <span className="text-blue-600">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User context position tag */}
        <div className="hidden lg:flex flex-col items-end border-r border-[#dfe1e6] pr-4 text-[10px]">
          <span className="font-bold text-slate-700">{user.position || 'Сотрудник'}</span>
          <span className="text-slate-450 font-semibold">{user.department || 'Коллектив'}</span>
        </div>

        {/* Dynamic Mail Box Badge */}
        <Link
          href="/messages"
          className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-colors"
          title="Ішкі хаттар"
        >
          <Mail size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center border border-white animate-pulse">
              {unreadCount}
            </span>
          )}
        </Link>

        {/* Dynamic Notifications Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-colors"
            title="Хабарландырулар"
          >
            <Bell size={18} />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-blue-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center border border-white animate-pulse">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Dropdown panel */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden transition-all duration-150 transform origin-top-right">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50">
                <span className="font-bold text-[10px] text-slate-800 uppercase tracking-wider">Хабарландырулар</span>
                {unreadNotificationsCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
                  >
                    <Check size={12} /> Барлығын оқу
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <Bell size={28} className="text-slate-350 mb-2" />
                    <p className="text-xs font-semibold text-slate-500">Жаңа хабарландырулар жоқ</p>
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
                        {n.type === 'warning' && <AlertCircle size={16} className="text-amber-500" />}
                        {n.type === 'success' && <CheckCircle size={16} className="text-emerald-500" />}
                        {n.type === 'info' && <Info size={16} className="text-blue-500" />}
                        {n.type === 'mail' && <Mail size={16} className="text-indigo-500" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className={`text-xs truncate ${!n.read ? 'text-slate-800 font-bold' : 'text-slate-650 font-medium'}`}>
                            {n.title}
                          </p>
                          <span className="text-[9px] text-slate-400 shrink-0 font-bold">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-normal font-medium">{n.description}</p>
                        
                        {n.link && (
                          <Link
                            href={n.link}
                            onClick={() => setIsOpen(false)}
                            className="inline-block mt-2 text-[10px] font-bold text-blue-600 hover:underline"
                          >
                            Толығырақ көру &rarr;
                          </Link>
                        )}
                      </div>

                      {/* Delete / Action */}
                      <button
                        onClick={(e) => deleteNotification(n.id, e)}
                        className="absolute right-3 top-4 text-slate-355 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-slate-100"
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
