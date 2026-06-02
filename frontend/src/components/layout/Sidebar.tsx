'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { useLanguage } from '../../context/LanguageContext';
import { useState } from 'react';
import {
  LayoutDashboard,
  Ticket,
  CheckSquare,
  Kanban,
  FileText,
  Mail,
  Users,
  Wallet,
  UserCheck,
  FolderOpen,
  Shield,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  UserCircle
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();
  const { t, language } = useLanguage();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!user) return null;

  // Define menu items with roles constraints and translated names
  const menuItems = [
    { name: t('navDashboard'), path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'OPERATOR', 'HR', 'ACCOUNTANT', 'MANAGER'] },
    { name: t('navTickets'), path: '/tickets', icon: Ticket, roles: ['ADMIN', 'OPERATOR', 'HR', 'ACCOUNTANT', 'MANAGER'] },
    { name: t('navTasks'), path: '/tasks', icon: CheckSquare, roles: ['ADMIN', 'OPERATOR', 'HR', 'ACCOUNTANT', 'MANAGER'] },
    { name: t('navKanban'), path: '/navKanban', icon: Kanban, roles: ['ADMIN', 'OPERATOR', 'HR', 'ACCOUNTANT', 'MANAGER'] }, // Wait, keep path as '/kanban'
    { name: t('navReports'), path: '/reports', icon: FileText, roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'] },
    { name: t('navMessages'), path: '/messages', icon: Mail, roles: ['ADMIN', 'OPERATOR', 'HR', 'ACCOUNTANT', 'MANAGER'] },
    { name: t('navHR'), path: '/hr', icon: Users, roles: ['ADMIN', 'HR', 'MANAGER'] },
    { name: t('navFinance'), path: '/finance', icon: Wallet, roles: ['ADMIN', 'ACCOUNTANT', 'MANAGER'] },
    { name: t('navEmployees'), path: '/employees', icon: UserCheck, roles: ['ADMIN', 'OPERATOR', 'HR', 'ACCOUNTANT', 'MANAGER'] },
    { name: t('navApprovals'), path: '/approvals', icon: CheckSquare, roles: ['ADMIN', 'MANAGER'] },
    { name: t('navFiles'), path: '/files', icon: FolderOpen, roles: ['ADMIN', 'OPERATOR', 'HR', 'ACCOUNTANT', 'MANAGER'] },
    { name: t('navAdmin'), path: '/admin', icon: Shield, roles: ['ADMIN'] },
    { name: t('navSettings'), path: '/settings', icon: Settings, roles: ['ADMIN', 'OPERATOR', 'HR', 'ACCOUNTANT', 'MANAGER'] },
  ];

  // Fix: make sure Kanban path matches '/kanban'
  menuItems[3].name = t('navKanban');
  menuItems[3].path = '/kanban';

  // Filter links based on current user role
  const allowedItems = menuItems.filter((item) => item.roles.includes(user.role));

  const handleLogout = () => {
    clearAuth();
    window.location.href = '/login';
  };

  return (
    <aside
      className={`h-screen bg-[#fafbfc] text-slate-700 flex flex-col justify-between transition-all duration-300 border-r border-[#dfe1e6] shrink-0 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div>
        {/* Header Branding */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#dfe1e6] bg-white">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                S
              </div>
              <span className="text-sm font-bold tracking-tight text-slate-800 uppercase">
                {t('appName')}
              </span>
            </div>
          )}
          {isCollapsed && (
            <span className="text-md font-extrabold mx-auto text-blue-600">SD</span>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-slate-100 border border-slate-200/50 rounded transition-colors text-slate-500 hover:text-slate-700 hidden md:block"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* User Card */}
        <div className={`p-3 border-b border-[#dfe1e6] flex items-center gap-3 bg-slate-50/50 ${isCollapsed ? 'justify-center' : ''}`}>
          {user.avatar ? (
            <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full border border-slate-350 object-cover" />
          ) : (
            <UserCircle size={28} className="text-slate-400 shrink-0" />
          )}
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-800 truncate leading-tight">{user.firstName} {user.lastName}</p>
              <span className="text-[10px] text-blue-600 font-bold truncate tracking-wide uppercase">{user.role}</span>
            </div>
          )}
        </div>

        {/* Navigation List */}
        <nav className="p-2 space-y-0.5 overflow-y-auto max-h-[calc(100vh-140px)]">
          {allowedItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-[#deebff] text-[#0052cc] shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={item.name}
              >
                <Icon size={16} className={`shrink-0 ${isActive ? 'text-[#0052cc]' : 'text-slate-400'}`} />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout Footer */}
      <div className="p-2 border-t border-[#dfe1e6] bg-white">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={t('Logout')}
        >
          <LogOut size={16} className="shrink-0 text-slate-450" />
          {!isCollapsed && <span>{language === 'kk' ? 'Шығу (Logout)' : language === 'en' ? 'Logout' : 'Выйти (Logout)'}</span>}
        </button>
      </div>
    </aside>
  );
}
