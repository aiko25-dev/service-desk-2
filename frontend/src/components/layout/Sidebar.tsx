'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { useState } from 'react';
import {
  LayoutDashboard,
  Ticket,
  Kanban,
  Mail,
  Users,
  Wallet,
  CheckSquare,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
  UserCircle
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!user) return null;

  // Define menu items with roles constraints
  const menuItems = [
    { name: 'Панель управления', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'OPERATOR', 'HR', 'ACCOUNTANT', 'MANAGER'] },
    { name: 'Заявки (Tickets)', path: '/tickets', icon: Ticket, roles: ['ADMIN', 'OPERATOR', 'HR', 'ACCOUNTANT', 'MANAGER'] },
    { name: 'Задачи Kanban', path: '/kanban', icon: Kanban, roles: ['ADMIN', 'OPERATOR', 'HR', 'ACCOUNTANT', 'MANAGER'] },
    { name: 'Внутренняя почта', path: '/messages', icon: Mail, roles: ['ADMIN', 'OPERATOR', 'HR', 'ACCOUNTANT', 'MANAGER'] },
    { name: 'HR модуль', path: '/hr', icon: Users, roles: ['ADMIN', 'HR', 'MANAGER'] },
    { name: 'Бухгалтерия', path: '/finance', icon: Wallet, roles: ['ADMIN', 'ACCOUNTANT', 'MANAGER'] },
    { name: 'Согласование', path: '/approvals', icon: CheckSquare, roles: ['ADMIN', 'MANAGER'] },
    { name: 'Панель управления', path: '/admin', icon: Shield, roles: ['ADMIN'] },
  ];

  // Filter links based on current user role
  const allowedItems = menuItems.filter((item) => item.roles.includes(user.role));

  const handleLogout = () => {
    clearAuth();
    window.location.href = '/login';
  };

  return (
    <aside
      className={`h-screen bg-slate-900 text-slate-100 flex flex-col justify-between transition-all duration-300 border-r border-slate-800 shrink-0 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div>
        {/* Header Branding */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-950">
          {!isCollapsed && (
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
              SERVICE DESK
            </span>
          )}
          {isCollapsed && (
            <span className="text-md font-bold mx-auto text-blue-400">SD</span>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-slate-100 hidden md:block"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* User Card */}
        <div className={`p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-900/50 ${isCollapsed ? 'justify-center' : ''}`}>
          {user.avatar ? (
            <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full border border-slate-700 object-cover" />
          ) : (
            <UserCircle size={32} className="text-slate-400 shrink-0" />
          )}
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate leading-tight">{user.firstName} {user.lastName}</p>
              <span className="text-xs text-blue-400 font-medium truncate tracking-wide">{user.role}</span>
            </div>
          )}
        </div>

        {/* Navigation List */}
        <nav className="p-2 space-y-1">
          {allowedItems.map((item) => {
            const isActive = pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={item.name}
              >
                <Icon size={18} className="shrink-0" />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout Footer */}
      <div className="p-2 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-950/40 hover:text-red-400 transition-colors ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title="Выйти из аккаунта"
        >
          <LogOut size={18} className="shrink-0" />
          {!isCollapsed && <span>Выйти</span>}
        </button>
      </div>
    </aside>
  );
}
