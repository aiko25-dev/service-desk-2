'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../hooks/useApi';
import { useAuthStore } from '../../store/authStore';
import { useState } from 'react';
import {
  Shield,
  UserPlus,
  Edit2,
  Trash2,
  FolderPlus,
  Search,
  CheckCircle,
  XCircle,
  FileText,
  UserCheck,
  UserX,
  X,
  AlertCircle,
  RefreshCw,
  Plus
} from 'lucide-react';

export default function AdminPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Active Tab: 'users' | 'categories' | 'logs'
  const [activeTab, setActiveTab] = useState<'users' | 'categories' | 'logs'>('users');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modals status
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Forms state
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'OPERATOR',
    department: '',
    position: '',
  });

  const [editUserForm, setEditUserForm] = useState({
    firstName: '',
    lastName: '',
    role: 'OPERATOR',
    department: '',
    position: '',
    isActive: true,
    password: '',
  });

  const [newCategoryName, setNewCategoryName] = useState('');

  // Fetch Users
  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data;
    },
    enabled: !!user && user.role === 'ADMIN',
  });

  // Fetch Categories
  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['adminCategories'],
    queryFn: async () => {
      const res = await api.get('/admin/categories');
      return res.data;
    },
    enabled: !!user && user.role === 'ADMIN',
  });

  // Fetch Audit Logs
  const { data: logs = [], isLoading: isLogsLoading } = useQuery({
    queryKey: ['adminLogs'],
    queryFn: async () => {
      const res = await api.get('/admin/logs');
      return res.data;
    },
    enabled: !!user && user.role === 'ADMIN',
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: async (data: typeof newUser) => {
      const res = await api.post('/users', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminLogs'] });
      setIsCreateUserOpen(false);
      setNewUser({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'OPERATOR',
        department: '',
        position: '',
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: string; payload: typeof editUserForm }) => {
      const { password, ...payloadWithoutPassword } = data.payload;
      const cleanPayload = password ? data.payload : payloadWithoutPassword;
      const res = await api.put(`/users/${data.id}`, cleanPayload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminLogs'] });
      setIsEditUserOpen(false);
      setSelectedUser(null);
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async (data: { id: string; isActive: boolean }) => {
      const res = await api.put(`/users/${data.id}`, { isActive: data.isActive });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminLogs'] });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await api.post('/admin/categories', { name });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
      queryClient.invalidateQueries({ queryKey: ['adminLogs'] });
      setNewCategoryName('');
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/admin/categories/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
      queryClient.invalidateQueries({ queryKey: ['adminLogs'] });
    },
  });

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-in text-center px-4">
        <Shield size={64} className="text-red-500 bg-red-50 p-3 rounded-2xl border border-red-100" />
        <h2 className="text-lg font-bold text-slate-800">Доступ ограничен</h2>
        <p className="text-slate-500 text-xs max-w-sm">
          Данный раздел предназначен исключительно для системных администраторов Service Desk.
        </p>
      </div>
    );
  }

  const handleOpenEditUser = (u: any) => {
    setSelectedUser(u);
    setEditUserForm({
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      department: u.department || '',
      position: u.position || '',
      isActive: u.isActive,
      password: '',
    });
    setIsEditUserOpen(true);
  };

  // Filtered lists
  const filteredUsers = users.filter((u: any) => {
    const term = searchQuery.toLowerCase();
    return (
      u.firstName.toLowerCase().includes(term) ||
      u.lastName.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.department && u.department.toLowerCase().includes(term)) ||
      (u.position && u.position.toLowerCase().includes(term))
    );
  });

  const filteredLogs = logs.filter((l: any) => {
    const term = searchQuery.toLowerCase();
    const userName = l.user ? `${l.user.firstName} ${l.user.lastName} ${l.user.email}`.toLowerCase() : 'система';
    return (
      l.action.toLowerCase().includes(term) ||
      l.details.toLowerCase().includes(term) ||
      userName.includes(term)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Shield className="text-blue-600" size={24} />
            Администрирование системы
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Управление учетными записями, категориями инцидентов и аудит активности в реальном времени.
          </p>
        </div>

        {/* Action button corresponding to active tab */}
        {activeTab === 'users' && (
          <button
            onClick={() => setIsCreateUserOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer transition-all shadow-sm text-xs"
          >
            <UserPlus size={16} />
            Создать пользователя
          </button>
        )}
      </div>

      {/* Overview stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="premium-card p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Пользователи</span>
            <h3 className="text-2xl font-black text-slate-800">{isUsersLoading ? '...' : users.length}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl">
            <UserCheck size={20} />
          </div>
        </div>
        
        <div className="premium-card p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Категории заявок</span>
            <h3 className="text-2xl font-black text-slate-800">{isCategoriesLoading ? '...' : categories.length}</h3>
          </div>
          <div className="p-3 bg-teal-50 text-teal-600 border border-teal-100 rounded-xl">
            <FolderPlus size={20} />
          </div>
        </div>

        <div className="premium-card p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Журнал аудита</span>
            <h3 className="text-2xl font-black text-slate-800">{isLogsLoading ? '...' : logs.length}</h3>
          </div>
          <div className="p-3 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl">
            <FileText size={20} />
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => { setActiveTab('users'); setSearchQuery(''); }}
          className={`pb-3 text-xs font-bold transition-all relative ${
            activeTab === 'users' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Учетные записи
          {activeTab === 'users' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
        </button>
        <button
          onClick={() => { setActiveTab('categories'); setSearchQuery(''); }}
          className={`pb-3 text-xs font-bold transition-all relative ${
            activeTab === 'categories' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Категории
          {activeTab === 'categories' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
        </button>
        <button
          onClick={() => { setActiveTab('logs'); setSearchQuery(''); }}
          className={`pb-3 text-xs font-bold transition-all relative ${
            activeTab === 'logs' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Логи аудита
          {activeTab === 'logs' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
        </button>
      </div>

      {/* TAB CONTENT: Users */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Поиск по ФИО, email, отделу или должности..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all shadow-sm"
            />
          </div>

          <div className="premium-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <th className="p-4">ФИО / Email</th>
                    <th className="p-4">Роль</th>
                    <th className="p-4">Отдел / Должность</th>
                    <th className="p-4">Статус</th>
                    <th className="p-4">Дата приема</th>
                    <th className="p-4 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {isUsersLoading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        Загрузка пользователей...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        Пользователи не найдены
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u: any) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-800">
                              {u.firstName} {u.lastName}
                            </span>
                            <span className="block text-[10px] text-slate-400 font-normal">{u.email}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              u.role === 'ADMIN'
                                ? 'bg-red-50 text-red-600 border border-red-100'
                                : u.role === 'MANAGER'
                                ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                : u.role === 'HR'
                                ? 'bg-teal-50 text-teal-600 border border-teal-100'
                                : u.role === 'ACCOUNTANT'
                                ? 'bg-amber-50 text-amber-600 border border-amber-100'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4 text-slate-600">
                          <div className="space-y-0.5">
                            <span className="font-semibold">{u.department || '—'}</span>
                            <span className="block text-[10px] text-slate-400 font-normal">{u.position || '—'}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          {u.isActive ? (
                            <span className="flex items-center gap-1 text-emerald-600 font-bold text-[10px]">
                              <CheckCircle size={12} /> Активен
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-rose-500 font-bold text-[10px]">
                              <XCircle size={12} /> Заблокирован
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-slate-500">
                          {u.joinDate ? new Date(u.joinDate).toLocaleDateString() : '—'}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditUser(u)}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
                              title="Редактировать"
                            >
                              <Edit2 size={14} />
                            </button>
                            
                            {u.id !== user.id && (
                              <button
                                onClick={() =>
                                  toggleUserStatusMutation.mutate({ id: u.id, isActive: !u.isActive })
                                }
                                className={`p-1.5 hover:bg-slate-100 rounded-lg transition-colors ${
                                  u.isActive ? 'text-rose-500 hover:text-rose-700' : 'text-emerald-600 hover:text-emerald-800'
                                }`}
                                title={u.isActive ? 'Заблокировать' : 'Разблокировать'}
                              >
                                {u.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Categories */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Create Category form */}
          <div className="premium-card p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FolderPlus size={16} className="text-blue-500" />
              Добавить категорию
            </h3>
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Название категории
              </label>
              <input
                type="text"
                placeholder="Например, Оргтехника, Серверы..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all"
              />
            </div>
            <button
              onClick={() => {
                if (newCategoryName.trim()) createCategoryMutation.mutate(newCategoryName);
              }}
              disabled={createCategoryMutation.isPending || !newCategoryName.trim()}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors text-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus size={14} />
              Сохранить категорию
            </button>
          </div>

          {/* Categories list */}
          <div className="md:col-span-2 premium-card p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Список категорий</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {isCategoriesLoading ? (
                <div className="text-slate-400 text-xs col-span-2 text-center py-8">
                  Загрузка категорий...
                </div>
              ) : categories.length === 0 ? (
                <div className="text-slate-400 text-xs col-span-2 text-center py-8">
                  Категории отсутствуют. Добавьте первую!
                </div>
              ) : (
                categories.map((c: any) => (
                  <div
                    key={c.id}
                    className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 flex items-center justify-between gap-3 text-xs"
                  >
                    <span className="font-semibold text-slate-800">{c.name}</span>
                    <button
                      onClick={() => {
                        if (confirm(`Удалить категорию "${c.name}"?`)) {
                          deleteCategoryMutation.mutate(c.id);
                        }
                      }}
                      className="text-slate-400 hover:text-rose-500 p-1 rounded hover:bg-slate-100 transition-all cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Audit Logs */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Поиск по действию, деталям или имени..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all shadow-sm"
            />
          </div>

          <div className="premium-card p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Журнал изменений</h3>
            <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-1">
              {isLogsLoading ? (
                <div className="text-slate-400 text-xs text-center py-10">Загрузка логов...</div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-slate-400 text-xs text-center py-10">Логи не обнаружены</div>
              ) : (
                filteredLogs.map((l: any) => (
                  <div
                    key={l.id}
                    className="p-3.5 border border-slate-150 rounded-xl bg-slate-50/30 flex flex-col md:flex-row md:items-start justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-200/60 text-slate-700 rounded text-[9px] font-bold uppercase tracking-wider border border-slate-300">
                          {l.action}
                        </span>
                        {l.user && (
                          <span className="text-[10px] text-slate-500 font-bold">
                            Инициатор: {l.user.firstName} {l.user.lastName} ({l.user.role})
                          </span>
                        )}
                      </div>
                      <p className="text-slate-700 font-medium">{l.details}</p>
                    </div>

                    <span className="text-[10px] text-slate-400 shrink-0 self-end md:self-start">
                      {new Date(l.createdAt).toLocaleString('ru-RU')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create User */}
      {isCreateUserOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-800">Создание нового сотрудника</h3>
                <p className="text-slate-500 text-[10px]">Заполните учетные данные для авторизации в системе.</p>
              </div>
              <button
                onClick={() => setIsCreateUserOpen(false)}
                className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
              {createUserMutation.isError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{(createUserMutation.error as any)?.response?.data?.message || 'Ошибка создания пользователя'}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Имя</label>
                  <input
                    type="text"
                    required
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Фамилия</label>
                  <input
                    type="text"
                    required
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Email</label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Пароль</label>
                  <input
                    type="password"
                    placeholder="Company123!"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Роль</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all"
                  >
                    <option value="OPERATOR">OPERATOR</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="HR">HR</option>
                    <option value="ACCOUNTANT">ACCOUNTANT</option>
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Отдел</label>
                  <input
                    type="text"
                    value={newUser.department}
                    onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Должность</label>
                  <input
                    type="text"
                    value={newUser.position}
                    onChange={(e) => setNewUser({ ...newUser, position: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setIsCreateUserOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors text-xs cursor-pointer"
              >
                Отмена
              </button>
              <button
                onClick={() => createUserMutation.mutate(newUser)}
                disabled={createUserMutation.isPending}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {createUserMutation.isPending && <RefreshCw size={12} className="animate-spin" />}
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit User */}
      {isEditUserOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-800">Редактирование сотрудника</h3>
                <p className="text-slate-500 text-[10px]">Сотрудник: {selectedUser.email}</p>
              </div>
              <button
                onClick={() => { setIsEditUserOpen(false); setSelectedUser(null); }}
                className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
              {updateUserMutation.isError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{(updateUserMutation.error as any)?.response?.data?.message || 'Ошибка обновления пользователя'}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Имя</label>
                  <input
                    type="text"
                    required
                    value={editUserForm.firstName}
                    onChange={(e) => setEditUserForm({ ...editUserForm, firstName: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Фамилия</label>
                  <input
                    type="text"
                    required
                    value={editUserForm.lastName}
                    onChange={(e) => setEditUserForm({ ...editUserForm, lastName: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Роль</label>
                  <select
                    value={editUserForm.role}
                    onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all"
                  >
                    <option value="OPERATOR">OPERATOR</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="HR">HR</option>
                    <option value="ACCOUNTANT">ACCOUNTANT</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Статус аккаунта</label>
                  <select
                    value={editUserForm.isActive ? 'true' : 'false'}
                    onChange={(e) => setEditUserForm({ ...editUserForm, isActive: e.target.value === 'true' })}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all"
                  >
                    <option value="true">Активен</option>
                    <option value="false">Заблокирован</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Отдел</label>
                  <input
                    type="text"
                    value={editUserForm.department}
                    onChange={(e) => setEditUserForm({ ...editUserForm, department: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Должность</label>
                  <input
                    type="text"
                    value={editUserForm.position}
                    onChange={(e) => setEditUserForm({ ...editUserForm, position: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Новый пароль (оставьте пустым, чтобы не менять)
                </label>
                <input
                  type="password"
                  placeholder="Введите новый пароль..."
                  value={editUserForm.password}
                  onChange={(e) => setEditUserForm({ ...editUserForm, password: e.target.value })}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all"
                />
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => { setIsEditUserOpen(false); setSelectedUser(null); }}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors text-xs cursor-pointer"
              >
                Отмена
              </button>
              <button
                onClick={() => updateUserMutation.mutate({ id: selectedUser.id, payload: editUserForm })}
                disabled={updateUserMutation.isPending}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {updateUserMutation.isPending && <RefreshCw size={12} className="animate-spin" />}
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
