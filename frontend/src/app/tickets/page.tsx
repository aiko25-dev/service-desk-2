'use client';

import React, { useState, useTransition } from 'react';
import { Button, Space, Typography, Drawer, Descriptions, Tag, Timeline, List, Alert, notification, Divider, Card, Badge, message } from 'antd';
import {
  PlusOutlined,
  CloudDownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  CheckCircleOutlined,
  UserOutlined,
  InfoCircleOutlined,
  FolderOpenOutlined
} from '@ant-design/icons';
import TicketFilters from '@/components/tickets/TicketFilters';
import TicketTable, { TicketType } from '@/components/tickets/TicketTable';
import CreateTicketModal from '@/components/tickets/CreateTicketModal';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const initialTickets: TicketType[] = [
  {
    key: '1',
    id: 'SD-1021',
    subject: 'Проблема с доступом к корпоративной CRM',
    category: 'IT',
    priority: 'Высокий',
    status: 'Принята',
    assignee: 'Дмитрий К.',
    createdAt: '2026-05-25',
    description: 'При попытке входа в CRM систему выводится ошибка "403 Forbidden". Вчера доступ работал исправно. Права доступа ранее запрашивались через руководителя и подтверждались отделом безопасности.'
  },
  {
    key: '2',
    id: 'SD-1022',
    subject: 'Оформление справки 2-НДФЛ за 2025 год',
    category: 'HR',
    priority: 'Низкий',
    status: 'Новая',
    assignee: '',
    createdAt: '2026-05-26',
    description: 'Необходимо оформить справку 2-НДФЛ за полный период 2025 года для подачи налоговой декларации на налоговый вычет. Справка нужна в электронном виде с ЭЦП.'
  },
  {
    key: '3',
    id: 'SD-1023',
    subject: 'Замена картриджа в бухгалтерии',
    category: 'IT',
    priority: 'Средний',
    status: 'В работе',
    assignee: 'Иван С.',
    createdAt: '2026-05-24',
    description: 'Принтер HP LaserJet (комната 304) перестал печатать черный цвет, выводит сообщение "Тонер на исходе". Просим заменить картридж на новый.'
  },
  {
    key: '4',
    id: 'SD-1024',
    subject: 'Согласование бюджета на маркетинг (Q2)',
    category: 'Бухгалтерия',
    priority: 'Высокий',
    status: 'На согласовании',
    assignee: 'Анна Б.',
    createdAt: '2026-05-23',
    description: 'Бюджет маркетинговых кампаний на второй квартал 2026 года подготовлен и требует утверждения главным бухгалтером и финансовым директором.'
  },
  {
    key: '5',
    id: 'SD-1025',
    subject: 'Сбой сетевого диска (O:)',
    category: 'IT',
    priority: 'Высокий',
    status: 'Закрыта',
    assignee: 'Константин В.',
    createdAt: '2026-05-22',
    description: 'Общий сетевой диск O: перестал монтироваться у всех сотрудников отдела продаж. Ошибка сетевого пути. Вопрос решен после перезапуска службы Samba.'
  },
  {
    key: '6',
    id: 'SD-1026',
    subject: 'Заявление на ежегодный отпуск',
    category: 'HR',
    priority: 'Средний',
    status: 'Отклонена',
    assignee: 'Елена Р.',
    createdAt: '2026-05-20',
    description: 'Планирую отпуск с 10 июня на 14 календарных дней. Заявление согласовано с руководителем. Отклонено отделом HR из-за отсутствия замены на ключевой проект.'
  },
  {
    key: '7',
    id: 'SD-1027',
    subject: 'Настройка удаленного рабочего места',
    category: 'IT',
    priority: 'Средний',
    status: 'В работе',
    assignee: 'Иван С.',
    createdAt: '2026-05-25',
    description: 'Требуется настроить корпоративный VPN и удаленный рабочий стол (RDP) для нового сотрудника. Доступ к рабочим папкам согласован.'
  }
];

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketType[]>(initialTickets);
  const [filters, setFilters] = useState<any>({
    search: '',
    status: 'all',
    priority: 'all',
    dateRange: null
  });
  
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [exporting, setExporting] = useState(false);

  // Notification API hook
  const [api, contextHolder] = notification.useNotification();

  // Excel Export simulator
  const handleExportExcel = () => {
    setExporting(true);
    message.loading({ content: 'Генерация файла Excel...', key: 'export_key' });
    
    setTimeout(() => {
      setExporting(false);
      message.destroy('export_key');
      
      api.success({
        message: 'Экспорт завершен',
        description: 'Файл "Service_Desk_Tickets_Export.xlsx" успешно сгенерирован и загружен на устройство.',
        icon: <FileExcelOutlined style={{ color: '#52c41a' }} />,
        placement: 'bottomRight',
        duration: 4.5
      });
    }, 1500);
  };

  // Filter logic
  const filteredTickets = tickets.filter((ticket) => {
    // 1. Text Search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchId = ticket.id.toLowerCase().includes(searchLower);
      const matchSubject = ticket.subject.toLowerCase().includes(searchLower);
      if (!matchId && !matchSubject) return false;
    }

    // 2. Status Filter
    if (filters.status && filters.status !== 'all') {
      if (ticket.status !== filters.status) return false;
    }

    // 3. Priority Filter
    if (filters.priority && filters.priority !== 'all') {
      if (ticket.priority !== filters.priority) return false;
    }

    // 4. Date Range Filter
    if (filters.dateRange && filters.dateRange.length === 2) {
      const startDate = dayjs(filters.dateRange[0]).startOf('day');
      const endDate = dayjs(filters.dateRange[1]).endOf('day');
      const ticketDate = dayjs(ticket.createdAt);
      if (ticketDate.isBefore(startDate) || ticketDate.isAfter(endDate)) return false;
    }

    return true;
  });

  // Ticket creation handler
  const handleCreateTicketSubmit = (values: any) => {
    const nextIdNumber = 1000 + tickets.length + 1;
    const newTicket: TicketType = {
      key: String(tickets.length + 1),
      id: `SD-${nextIdNumber}`,
      subject: values.subject,
      category: values.category,
      priority: values.priority,
      status: 'Новая',
      assignee: '', // New tickets start with empty assignee
      createdAt: dayjs().format('YYYY-MM-DD'),
      description: values.description
    };

    setTickets([newTicket, ...tickets]);
    setModalOpen(false);

    api.success({
      message: 'Заявка зарегистрирована',
      description: `Ваша заявка ${newTicket.id} успешно добавлена в реестр со статусом "Новая".`,
      placement: 'bottomRight',
      duration: 5
    });
  };

  // Details drawer trigger
  const handleViewDetails = (ticket: TicketType) => {
    setSelectedTicket(ticket);
    setDrawerOpen(true);
  };

  // Get ticket detail tag rendering
  const getDetailStatusTag = (status?: TicketType['status']) => {
    if (!status) return null;
    switch (status) {
      case 'Новая': return <Tag color="default" className="border-none px-3 py-1 font-bold">Новая</Tag>;
      case 'Принята': return <Tag color="blue" className="border-none px-3 py-1 font-bold">Принята</Tag>;
      case 'В работе': return <Tag color="warning" className="border-none px-3 py-1 font-bold">В работе</Tag>;
      case 'На согласовании': return <Tag color="purple" className="border-none px-3 py-1 font-bold">На согласовании</Tag>;
      case 'Закрыта': return <Tag color="success" className="border-none px-3 py-1 font-bold">Закрыта</Tag>;
      case 'Отклонена': return <Tag color="error" className="border-none px-3 py-1 font-bold">Отклонена</Tag>;
      default: return <Tag>{status}</Tag>;
    }
  };

  const getDetailPriorityBadge = (priority?: TicketType['priority']) => {
    if (!priority) return null;
    switch (priority) {
      case 'Высокий': return <Badge status="error" text={<span className="text-red-400 font-bold">Высокий приоритет</span>} />;
      case 'Средний': return <Badge status="warning" text={<span className="text-amber-400 font-medium">Средний приоритет</span>} />;
      case 'Низкий': return <Badge status="default" text={<span className="text-slate-400">Низкий приоритет</span>} />;
    }
  };

  return (
    <div className="flex flex-col gap-6 relative">
      {contextHolder}

      {/* Decorative glows */}
      <div className="bg-glow-blue top-0 left-0" />
      <div className="bg-glow-purple bottom-10 right-10" />

      {/* Header and Action Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div>
          <Title level={2} className="text-slate-850 font-bold m-0 tracking-tight">Өтінімдер тізілімі (Tickets)</Title>
          <Text className="text-slate-500 text-sm font-semibold mt-1 block">
            Корпоративтік өтінімдерді басқарыңыз, статустарды сүзіңіз және SLA орындалуын нақты уақытта қадағалаңыз.
          </Text>
        </div>
        
        <Space size="middle" className="relative z-10">
          <Button
            type="text"
            icon={<CloudDownloadOutlined />}
            onClick={handleExportExcel}
            loading={exporting}
            className="h-10 text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-4 flex items-center justify-center gap-1.5 transition-all font-semibold cursor-pointer"
          >
            Excel-ге экспорттау
          </Button>
          
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 border-none px-5 rounded-lg font-semibold shadow-sm h-10 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            Өтінім жасау
          </Button>
        </Space>
      </div>

      {/* Filters Form */}
      <div className="relative z-10">
        <TicketFilters onFilterChange={(newFilters) => setFilters(newFilters)} />
      </div>

      {/* Main Tickets Table */}
      <div className="relative z-10">
        <TicketTable 
          dataSource={filteredTickets} 
          onViewDetails={handleViewDetails}
        />
      </div>

      {/* Create Ticket Modal */}
      <CreateTicketModal 
        open={modalOpen} 
        onCancel={() => setModalOpen(false)} 
        onSubmit={handleCreateTicketSubmit}
      />

      {/* High-Fidelity Details Side Drawer */}
      <Drawer
        title={
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 -mt-2">
            <span className="text-slate-800 font-bold text-base">Өтінім мәліметтері {selectedTicket?.id}</span>
            {getDetailStatusTag(selectedTicket?.status)}
          </div>
        }
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={550}
        styles={{
          header: { background: '#ffffff', borderBottom: '1px solid #dfe1e6' },
          body: { background: '#ffffff', color: '#172b4d' }
        }}
      >
        {selectedTicket && (
          <div className="flex flex-col gap-6 text-xs font-semibold">
            
            {/* Subject card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block mb-1">
                Өтінім тақырыбы
              </span>
              <Title level={4} className="text-slate-800 font-bold m-0 leading-snug">
                {selectedTicket.subject}
              </Title>
              <div className="mt-3 flex items-center gap-4">
                {getDetailPriorityBadge(selectedTicket.priority)}
                <Tag className="bg-slate-100 border-none text-slate-600 px-2 rounded">
                  Санаты: {selectedTicket.category}
                </Tag>
              </div>
            </div>

            {/* Content descriptions */}
            <Descriptions 
              column={1} 
              bordered 
              size="small" 
              className="custom-descriptions border border-slate-200 rounded-xl overflow-hidden text-xs"
              labelStyle={{ background: '#f4f5f7', color: '#5e6c84', width: '130px', fontWeight: 'bold' }}
              contentStyle={{ background: '#ffffff', color: '#172b4d' }}
            >
              <Descriptions.Item label="Құрылған күні">
                <span className="font-mono">{selectedTicket.createdAt}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Жауапты">
                <Space>
                  <UserOutlined className="text-slate-400" />
                  <span>{selectedTicket.assignee || <span className="text-slate-400 italic">Тағайындалмаған</span>}</span>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Арнасы">
                <span>Жеке кабинет (Портал)</span>
              </Descriptions.Item>
            </Descriptions>

            {/* Problem Description */}
            <div>
              <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block mb-2">
                Мәселенің толық сипаттамасы
              </span>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-650 leading-relaxed whitespace-pre-line font-medium">
                {selectedTicket.description}
              </div>
            </div>

            {/* Attached Documents section */}
            <div>
              <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block mb-2 flex items-center gap-1">
                <FolderOpenOutlined className="text-blue-500" />
                Тіркелген құжаттар
              </span>
              <div className="flex flex-wrap gap-2">
                <Tag 
                  icon={<FilePdfOutlined className="text-red-500" />} 
                  className="px-3 py-1 bg-slate-50 border-slate-200 text-slate-600 font-semibold rounded-lg cursor-pointer hover:border-slate-400 transition-all"
                >
                  technical_logs.pdf (4.2 MB)
                </Tag>
                <Tag 
                  icon={<FileExcelOutlined className="text-green-600" />} 
                  className="px-3 py-1 bg-slate-50 border-slate-200 text-slate-600 font-semibold rounded-lg cursor-pointer hover:border-slate-400 transition-all"
                >
                  screen_error_dump.png (1.8 MB)
                </Tag>
              </div>
            </div>

            <Divider className="border-slate-200 m-0" />

            {/* Timeline of SLA updates */}
            <div>
              <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block mb-4">
                SLA бойынша өзгерістер тарихы
              </span>
              <Timeline
                mode="left"
                className="custom-timeline mt-2"
                items={[
                  {
                    color: 'gray',
                    children: (
                      <div>
                        <Text strong className="text-slate-700 text-xs block">Өтінім жүйеге сәтті тіркелді</Text>
                        <span className="text-[10px] text-slate-400 block font-mono">{selectedTicket.createdAt} 09:00</span>
                      </div>
                    ),
                  },
                  {
                    color: selectedTicket.status !== 'Новая' ? 'blue' : 'gray',
                    children: (
                      <div>
                        <Text strong className="text-slate-700 text-xs block">Санат бойынша автоматты сәйкестендіру: "{selectedTicket.category}"</Text>
                        <span className="text-[10px] text-slate-400 block font-mono">{selectedTicket.createdAt} 09:02</span>
                      </div>
                    ),
                  },
                  selectedTicket.assignee ? {
                    color: 'orange',
                    children: (
                      <div>
                        <Text strong className="text-slate-750 text-xs block">Орындаушы тағайындалды: {selectedTicket.assignee}</Text>
                        <span className="text-[10px] text-slate-400 block font-mono">{selectedTicket.createdAt} 10:15</span>
                      </div>
                    ),
                  } : null,
                  selectedTicket.status === 'Закрыта' ? {
                    color: 'green',
                    children: (
                      <div>
                        <Text strong className="text-slate-750 text-xs block">Орындау аяқталды. SLA регламенті бойынша жабылды</Text>
                        <span className="text-[10px] text-slate-400 block font-mono">{selectedTicket.createdAt} 16:40</span>
                      </div>
                    ),
                  } : null,
                  selectedTicket.status === 'Отклонена' ? {
                    color: 'red',
                    children: (
                      <div>
                        <Text strong className="text-red-650 text-xs block">Қолдау маманымен бас тартылды</Text>
                        <span className="text-[10px] text-slate-400 block font-mono">{selectedTicket.createdAt} 12:30</span>
                      </div>
                    ),
                  } : null
                ].filter(Boolean) as any}
              />
            </div>
            
          </div>
        )}
      </Drawer>
    </div>
  );
}
