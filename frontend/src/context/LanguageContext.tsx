'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'kk' | 'ru' | 'en';

const translations = {
  kk: {
    // Common / Global
    appName: 'Service Desk',
    appSubtitle: 'Корпоративтік өтінімдер порталы',
    loading: 'Жүктелуде...',
    save: 'Сақтау',
    cancel: 'Бас тарту',
    create: 'Құру',
    delete: 'Өшіру',
    edit: 'Өңдеу',
    active: 'Белсенді',
    blocked: 'Блокталған',
    actions: 'Әрекеттер',
    status: 'Статус',
    role: 'Рөл',
    date: 'Күн',
    department: 'Департамент / Бөлім',
    position: 'Лауазымы',
    email: 'Электрондық пошта',
    password: 'Құпия сөз',
    search: 'Іздеу...',
    
    // Statuses
    STATUS_NEW: 'Жаңа',
    STATUS_ACCEPTED: 'Қабылданды',
    STATUS_IN_PROGRESS: 'Орындалуда',
    STATUS_PENDING_APPROVAL: 'Мақұлдауды күтуде',
    STATUS_CLOSED: 'Жабылды',
    STATUS_REJECTED: 'Қабылданбады',

    // Priorities
    PRIORITY_LOW: 'Төмен',
    PRIORITY_MEDIUM: 'Орташа',
    PRIORITY_HIGH: 'Жоғары',

    // Roles
    ROLE_ADMIN: 'Әкімші',
    ROLE_MANAGER: 'Жетекші',
    ROLE_OPERATOR: 'Оператор',
    ROLE_HR: 'HR Кадрлар',
    ROLE_ACCOUNTANT: 'Бухгалтер',

    // Sidebar
    navDashboard: 'Бақылау панелі',
    navTickets: 'Өтінімдер журналы',
    navTasks: 'Тапсырмалар тізімі',
    navKanban: 'Kanban тақтасы',
    navReports: 'Талдау және Есептер',
    navMessages: 'Ішкі хаттар',
    navHR: 'HR департаменті',
    navFinance: 'Бухгалтерия және Шығындар',
    navEmployees: 'Қызметкерлер тізімі',
    navApprovals: 'Мақұлдаулар',
    navFiles: 'Файлдар архиві',
    navAdmin: 'Әкімшілендіру',
    navSettings: 'Баптаулар',

    // LoginPage
    loginTitle: 'Service Desk жүйесіне кіру',
    loginSubtitle: 'Корпоративтік өтінімдерді басқару порталы',
    loginEmailLabel: 'Жұмыс поштасы (Email)',
    loginPasswordLabel: 'Құпия сөз (Password)',
    loginBtn: 'Порталға кіру',
    loginRequiredError: 'Электрондық пошта мен құпия сөзді толтырыңыз',
    loginInvalidError: 'Пошта немесе құпия сөз қате',

    // Navbar
    navbarActiveTitle: 'Жүйе белсенді',
    navbarRoleLabel: 'Рөл:',
    navbarMailTitle: 'Ішкі хаттар',
    navbarNotificationsTitle: 'Хабарландырулар',
    navbarNotificationEmpty: 'Жаңа хабарландырулар жоқ',
    navbarNotificationMarkAll: 'Барлығын оқу',
    navbarNotificationMore: 'Толығырақ көру',

    // Admin Page
    adminTitle: 'Жүйені әкімшілендіру',
    adminSubtitle: 'Уақыт белгісі бойынша тіркелгілерді, категорияларды және аудит журналын басқару.',
    adminTabUsers: 'Тіркелгілер',
    adminTabCategories: 'Категориялар',
    adminTabLogs: 'Аудит журналдары',
    adminStatUsers: 'Қолданушылар',
    adminStatCategories: 'Санаттар',
    adminStatLogs: 'Аудит журналы',
    adminSearchUsersPlaceholder: 'ФИО, пошта, бөлім немесе лауазым бойынша іздеу...',
    adminSearchLogsPlaceholder: 'Әрекет, мәлімет немесе аты бойынша іздеу...',
    adminCreateUserBtn: 'Қолданушыны құру',
    adminTableFio: 'ФИО / Email',
    adminTableDate: 'Тіркелген күні',
    adminStatusActive: 'Белсенді',
    adminStatusBlocked: 'Блокталған',
    adminConfirmBlock: 'Блоктау',
    adminConfirmUnblock: 'Блоктан шығару',
    
    // Admin Modal - Create User
    adminCreateModalTitle: 'Жаңа қызметкерді құру',
    adminCreateModalSubtitle: 'Жүйеге кіру үшін тіркелгі мәліметтерін толтырыңыз.',
    adminFormFirstName: 'Аты',
    adminFormLastName: 'Тегі',
    adminFormPasswordPlaceholder: 'Егер бос болса: Company123!',
    adminFormRole: 'Рөл',
    adminFormDept: 'Бөлім (IT, HR...)',
    adminFormPos: 'Лауазымы (Инженер...)',
    adminCreateSuccess: 'Қолданушы сәтті құрылды',
    adminCreateError: 'Қолданушыны құру қатесі',

    // Admin Modal - Edit User
    adminEditModalTitle: 'Қызметкерді өңдеу',
    adminEditModalStatus: 'Тіркелгі статусы',
    adminEditModalNewPassword: 'Жаңа құпия сөз (өзгертпеу үшін бос қалдырыңыз)',
    adminEditSuccess: 'Қолданушы сәтті жаңартылды',
    adminEditError: 'Қолданушыны жаңарту қатесі',

    // Admin Categories Tab
    adminCatAddTitle: 'Санат қосу',
    adminCatNameLabel: 'Санат атауы',
    adminCatPlaceholder: 'Мысалы, Оргтехника, Программалық қамтамасыз ету...',
    adminCatSaveBtn: 'Санатты сақтау',
    adminCatListTitle: 'Санаттар тізімі',
    adminCatEmpty: 'Санаттар жоқ. Бірінші санатты қосыңыз!',
    adminCatConfirmDelete: 'Санатты өшіруді растайсыз ба: ',

    // Settings Page
    settingsTitle: 'Платформа параметрлері',
    settingsSubtitle: 'Баптаулар (Settings)',
    settingsProfileSection: 'Жеке профиль мәліметтері',
    settingsFirstNameLabel: 'Аты (First name)',
    settingsLastNameLabel: 'Тіркелген Тегі (Last name)',
    settingsSaveSuccess: 'Жеке мәліметтер сәтті жаңартылды!',
    settingsSaveError: 'Профиль мәліметтерін сақтау мүмкін болмады',
    settingsRbacTitle: 'Қолжетімділік деңгейі (RBAC)',
    settingsRbacRole: 'Сіздің рөліңіз: ',
    settingsRbacRights: 'Сіздегі құқықтар:'
  },
  ru: {
    // Common / Global
    appName: 'Service Desk',
    appSubtitle: 'Портал корпоративных заявок',
    loading: 'Загрузка...',
    save: 'Сохранить',
    cancel: 'Отмена',
    create: 'Создать',
    delete: 'Удалить',
    edit: 'Редактировать',
    active: 'Активен',
    blocked: 'Заблокирован',
    actions: 'Действия',
    status: 'Статус',
    role: 'Роль',
    date: 'Дата',
    department: 'Департамент / Отдел',
    position: 'Должность',
    email: 'Электронная почта',
    password: 'Пароль',
    search: 'Поиск...',

    // Statuses
    STATUS_NEW: 'Новый',
    STATUS_ACCEPTED: 'Принят',
    STATUS_IN_PROGRESS: 'В работе',
    STATUS_PENDING_APPROVAL: 'На согласовании',
    STATUS_CLOSED: 'Закрыт',
    STATUS_REJECTED: 'Отклонен',

    // Priorities
    PRIORITY_LOW: 'Низкий',
    PRIORITY_MEDIUM: 'Средний',
    PRIORITY_HIGH: 'Высокий',

    // Roles
    ROLE_ADMIN: 'Администратор',
    ROLE_MANAGER: 'Руководитель',
    ROLE_OPERATOR: 'Оператор',
    ROLE_HR: 'HR Кадры',
    ROLE_ACCOUNTANT: 'Бухгалтер',

    // Sidebar
    navDashboard: 'Панель управления',
    navTickets: 'Журнал заявок',
    navTasks: 'Список задач',
    navKanban: 'Kanban доска',
    navReports: 'Аналитика и Отчеты',
    navMessages: 'Внутренняя почта',
    navHR: 'HR департамент',
    navFinance: 'Бухгалтерия и Расходы',
    navEmployees: 'Список сотрудников',
    navApprovals: 'Согласования',
    navFiles: 'Архив файлов',
    navAdmin: 'Администрирование',
    navSettings: 'Настройки',

    // LoginPage
    loginTitle: 'Вход в систему Service Desk',
    loginSubtitle: 'Портал управления корпоративными заявками',
    loginEmailLabel: 'Рабочая почта (Email)',
    loginPasswordLabel: 'Пароль (Password)',
    loginBtn: 'Войти в портал',
    loginRequiredError: 'Заполните адрес электронной почты и пароль',
    loginInvalidError: 'Неверный адрес почты или пароль',

    // Navbar
    navbarActiveTitle: 'Система активна',
    navbarRoleLabel: 'Роль:',
    navbarMailTitle: 'Внутренняя почта',
    navbarNotificationsTitle: 'Уведомления',
    navbarNotificationEmpty: 'Новых уведомлений нет',
    navbarNotificationMarkAll: 'Прочитать все',
    navbarNotificationMore: 'Посмотреть подробнее',

    // Admin Page
    adminTitle: 'Администрирование системы',
    adminSubtitle: 'Управление учетными записями, категориями инцидентов и аудит активности в реальном времени.',
    adminTabUsers: 'Учетные записи',
    adminTabCategories: 'Категории',
    adminTabLogs: 'Логи аудита',
    adminStatUsers: 'Пользователи',
    adminStatCategories: 'Категории заявок',
    adminStatLogs: 'Журнал аудита',
    adminSearchUsersPlaceholder: 'Поиск по ФИО, email, отделу или должности...',
    adminSearchLogsPlaceholder: 'Поиск по действию, деталям или имени...',
    adminCreateUserBtn: 'Создать пользователя',
    adminTableFio: 'ФИО / Email',
    adminTableDate: 'Дата приема',
    adminStatusActive: 'Активен',
    adminStatusBlocked: 'Заблокирован',
    adminConfirmBlock: 'Заблокировать',
    adminConfirmUnblock: 'Разблокировать',

    // Admin Modal - Create User
    adminCreateModalTitle: 'Создание нового сотрудника',
    adminCreateModalSubtitle: 'Заполните учетные данные для авторизации в системе.',
    adminFormFirstName: 'Имя',
    adminFormLastName: 'Фамилия',
    adminFormPasswordPlaceholder: 'Если пусто: Company123!',
    adminFormRole: 'Роль',
    adminFormDept: 'Отдел (IT, HR...)',
    adminFormPos: 'Должность (Инженер...)',
    adminCreateSuccess: 'Пользователь успешно создан',
    adminCreateError: 'Ошибка создания пользователя',

    // Admin Modal - Edit User
    adminEditModalTitle: 'Редактирование сотрудника',
    adminEditModalStatus: 'Статус аккаунта',
    adminEditModalNewPassword: 'Новый пароль (оставьте пустым, чтобы не менять)',
    adminEditSuccess: 'Пользователь успешно обновлен',
    adminEditError: 'Ошибка обновления пользователя',

    // Admin Categories Tab
    adminCatAddTitle: 'Добавить категорию',
    adminCatNameLabel: 'Название категории',
    adminCatPlaceholder: 'Например, Оргтехника, Серверы...',
    adminCatSaveBtn: 'Сохранить категорию',
    adminCatListTitle: 'Список категорий',
    adminCatEmpty: 'Категории отсутствуют. Добавьте первую!',
    adminCatConfirmDelete: 'Удалить категорию: ',

    // Settings Page
    settingsTitle: 'Параметры платформы',
    settingsSubtitle: 'Настройки (Settings)',
    settingsProfileSection: 'Личные данные профиля',
    settingsFirstNameLabel: 'Имя (First name)',
    settingsLastNameLabel: 'Фамилия (Last name)',
    settingsSaveSuccess: 'Личные данные успешно обновлены!',
    settingsSaveError: 'Не удалось обновить профиль',
    settingsRbacTitle: 'Уровень доступа (RBAC)',
    settingsRbacRole: 'Ваша роль: ',
    settingsRbacRights: 'Доступные вам права:'
  },
  en: {
    // Common / Global
    appName: 'Service Desk',
    appSubtitle: 'Corporate Ticketing Portal',
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    create: 'Create',
    delete: 'Delete',
    edit: 'Edit',
    active: 'Active',
    blocked: 'Blocked',
    actions: 'Actions',
    status: 'Status',
    role: 'Role',
    date: 'Date',
    department: 'Department / Section',
    position: 'Position',
    email: 'Email address',
    password: 'Password',
    search: 'Search...',

    // Statuses
    STATUS_NEW: 'New',
    STATUS_ACCEPTED: 'Accepted',
    STATUS_IN_PROGRESS: 'In Progress',
    STATUS_PENDING_APPROVAL: 'Pending Approval',
    STATUS_CLOSED: 'Closed',
    STATUS_REJECTED: 'Rejected',

    // Priorities
    PRIORITY_LOW: 'Low',
    PRIORITY_MEDIUM: 'Medium',
    PRIORITY_HIGH: 'High',

    // Roles
    ROLE_ADMIN: 'Administrator',
    ROLE_MANAGER: 'Manager',
    ROLE_OPERATOR: 'Operator',
    ROLE_HR: 'HR Personnel',
    ROLE_ACCOUNTANT: 'Accountant',

    // Sidebar
    navDashboard: 'Dashboard',
    navTickets: 'Tickets Log',
    navTasks: 'Tasks List',
    navKanban: 'Kanban Board',
    navReports: 'Analytics & Reports',
    navMessages: 'Internal Mail',
    navHR: 'HR Department',
    navFinance: 'Accounting & Finance',
    navEmployees: 'Employees Roster',
    navApprovals: 'Approvals',
    navFiles: 'Files Archive',
    navAdmin: 'Administration',
    navSettings: 'Settings',

    // LoginPage
    loginTitle: 'Sign in to Service Desk',
    loginSubtitle: 'Corporate requests management portal',
    loginEmailLabel: 'Work Email',
    loginPasswordLabel: 'Password',
    loginBtn: 'Sign In',
    loginRequiredError: 'Please enter email and password',
    loginInvalidError: 'Invalid email or password',

    // Navbar
    navbarActiveTitle: 'System online',
    navbarRoleLabel: 'Role:',
    navbarMailTitle: 'Internal Mail',
    navbarNotificationsTitle: 'Notifications',
    navbarNotificationEmpty: 'No new notifications',
    navbarNotificationMarkAll: 'Mark all as read',
    navbarNotificationMore: 'View details',

    // Admin Page
    adminTitle: 'System Administration',
    adminSubtitle: 'Manage user accounts, ticketing categories and real-time audit logs.',
    adminTabUsers: 'User Accounts',
    adminTabCategories: 'Categories',
    adminTabLogs: 'Audit Logs',
    adminStatUsers: 'Active Users',
    adminStatCategories: 'Ticket Categories',
    adminStatLogs: 'Audit Entries',
    adminSearchUsersPlaceholder: 'Search by name, email, department or position...',
    adminSearchLogsPlaceholder: 'Search by action, details or name...',
    adminCreateUserBtn: 'Create User',
    adminTableFio: 'Full Name / Email',
    adminTableDate: 'Hire Date',
    adminStatusActive: 'Active',
    adminStatusBlocked: 'Blocked',
    adminConfirmBlock: 'Block User',
    adminConfirmUnblock: 'Unblock User',

    // Admin Modal - Create User
    adminCreateModalTitle: 'Create New Employee',
    adminCreateModalSubtitle: 'Provide login credentials for system authorization.',
    adminFormFirstName: 'First Name',
    adminFormLastName: 'Last Name',
    adminFormPasswordPlaceholder: 'Default: Company123!',
    adminFormRole: 'Role',
    adminFormDept: 'Department (IT, HR...)',
    adminFormPos: 'Position (Engineer...)',
    adminCreateSuccess: 'User created successfully',
    adminCreateError: 'Error creating user',

    // Admin Modal - Edit User
    adminEditModalTitle: 'Edit Employee Details',
    adminEditModalStatus: 'Account Status',
    adminEditModalNewPassword: 'New password (leave blank to keep unchanged)',
    adminEditSuccess: 'User updated successfully',
    adminEditError: 'Error updating user',

    // Admin Categories Tab
    adminCatAddTitle: 'Add Category',
    adminCatNameLabel: 'Category Name',
    adminCatPlaceholder: 'e.g. Office Hardware, Software...',
    adminCatSaveBtn: 'Save Category',
    adminCatListTitle: 'Categories List',
    adminCatEmpty: 'No categories found. Create the first one!',
    adminCatConfirmDelete: 'Delete category: ',

    // Settings Page
    settingsTitle: 'Platform Parameters',
    settingsSubtitle: 'Settings',
    settingsProfileSection: 'Personal Profile Details',
    settingsFirstNameLabel: 'First name',
    settingsLastNameLabel: 'Last name',
    settingsSaveSuccess: 'Profile updated successfully!',
    settingsSaveError: 'Failed to update profile settings',
    settingsRbacTitle: 'Access Level (RBAC)',
    settingsRbacRole: 'Your role: ',
    settingsRbacRights: 'Assigned permissions:'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('kk');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load persisted language from localStorage
    const saved = localStorage.getItem('service_desk_lang') as Language;
    if (saved && (saved === 'kk' || saved === 'ru' || saved === 'en')) {
      setLanguageState(saved);
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('service_desk_lang', lang);
  };

  const t = (key: string): string => {
    const langDict = translations[language];
    // Check if key exists, otherwise return key
    return (langDict as any)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {mounted ? children : <div className="h-screen w-screen bg-slate-900 text-slate-400 flex items-center justify-center">Loading...</div>}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
