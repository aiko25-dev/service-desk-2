'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/hooks/useApi';
import { useAuthStore } from '@/store/authStore';
import { Button, Space, Typography, Drawer, Descriptions, Tag, Timeline, Alert, notification, Divider, Badge, message, Input } from 'antd';
import {
  PlusOutlined,
  CloudDownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  CheckCircleOutlined,
  UserOutlined,
  FolderOpenOutlined,
  SendOutlined
} from '@ant-design/icons';
import TicketFilters from '@/components/tickets/TicketFilters';
import TicketTable, { TicketType } from '@/components/tickets/TicketTable';
import CreateTicketModal from '@/components/tickets/CreateTicketModal';
import dayjs from 'dayjs';
import { useLanguage } from '@/context/LanguageContext';

const { Title, Text } = Typography;

// Helper maps for mapping backend <-> frontend enums
const mapFrontendStatusToBackend = (status: string) => {
  switch (status) {
    case 'Новая': return 'NEW';
    case 'Принята': return 'ACCEPTED';
    case 'В работе': return 'IN_PROGRESS';
    case 'На согласовании': return 'PENDING_APPROVAL';
    case 'Закрыта': return 'CLOSED';
    case 'Отклонена': return 'REJECTED';
    default: return undefined;
  }
};

const mapFrontendPriorityToBackend = (priority: string) => {
  switch (priority) {
    case 'Высокий': return 'HIGH';
    case 'Средний': return 'MEDIUM';
    case 'Низкий': return 'LOW';
    default: return undefined;
  }
};

const mapBackendStatusToFrontend = (status: string) => {
  switch (status) {
    case 'NEW': return 'Новая';
    case 'ACCEPTED': return 'Принята';
    case 'IN_PROGRESS': return 'В работе';
    case 'PENDING_APPROVAL': return 'На согласовании';
    case 'CLOSED': return 'Закрыта';
    case 'REJECTED': return 'Отклонена';
    default: return 'Новая';
  }
};

const mapBackendPriorityToFrontend = (priority: string) => {
  switch (priority) {
    case 'HIGH': return 'Высокий';
    case 'MEDIUM': return 'Средний';
    case 'LOW': return 'Низкий';
    default: return 'Средний';
  }
};

export default function TicketsPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { t } = useLanguage();

  // Selected ticket from list/URL
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  
  // Filter States
  const [filters, setFilters] = useState<any>({
    search: '',
    status: 'all',
    priority: 'all',
    dateRange: null
  });
  
  // Modal & Export States
  const [modalOpen, setModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('по НБД');

  // Comments and status change states inside Drawer
  const [commentText, setCommentText] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [isStatusChanging, setIsStatusChanging] = useState(false);
  const [newStatusValue, setNewStatusValue] = useState('');

  // Notification API hook
  const [apiNotification, contextHolder] = notification.useNotification();

  // Sync selected ticket from query parameter `id`
  useEffect(() => {
    const ticketId = searchParams.get('id');
    if (ticketId) {
      setSelectedTicketId(ticketId);
    }
  }, [searchParams]);

  // Fetch Tickets List
  const { data: tickets = [], isLoading: isTicketsLoading } = useQuery<TicketType[]>({
    queryKey: ['tickets', { filters, activeTab }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== 'all') {
        const backendStatus = mapFrontendStatusToBackend(filters.status);
        if (backendStatus) params.append('status', backendStatus);
      }
      if (filters.priority && filters.priority !== 'all') {
        const backendPriority = mapFrontendPriorityToBackend(filters.priority);
        if (backendPriority) params.append('priority', backendPriority);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.append('startDate', dayjs(filters.dateRange[0]).startOf('day').toISOString());
        params.append('endDate', dayjs(filters.dateRange[1]).endOf('day').toISOString());
      }
      params.append('category', activeTab);

      const res = await api.get(`/tickets?${params.toString()}`);
      return res.data.map((t: any) => ({
        key: t.id,
        id: t.id,
        subject: t.title, // Map backend 'title' to frontend 'subject'
        category: t.category,
        priority: mapBackendPriorityToFrontend(t.priority) as any,
        status: mapBackendStatusToFrontend(t.status) as any,
        assignee: t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}` : '',
        createdAt: dayjs(t.createdAt).format('DD.MM.YYYY'),
        description: t.description,
        company: t.company || (t.creator ? `${t.creator.firstName} ${t.creator.lastName}` : ''),
        phone: t.phone || '',
        email: t.email || (t.creator ? t.creator.email : ''),
        line2: t.line2 || '',
        line3: t.line3 || '',
        section: t.section || '',
        resolution: t.resolution || '',
      }));
    },
    enabled: !!user,
  });

  // Fetch Selected Ticket Details
  const { data: ticketDetails, isLoading: isDetailsLoading } = useQuery({
    queryKey: ['ticket', selectedTicketId],
    queryFn: async () => {
      if (!selectedTicketId) return null;
      const res = await api.get(`/tickets/${selectedTicketId}`);
      return res.data;
    },
    enabled: !!selectedTicketId,
  });

  // --- Mutations ---

  // Create Ticket Mutation (with file uploads)
  const createTicketMutation = useMutation({
    mutationFn: async (values: any) => {
      const fileIds: string[] = [];

      // If files are attached, upload them first
      if (values.files && values.files.length > 0) {
        for (const fileObj of values.files) {
          const fileToUpload = fileObj.originFileObj || fileObj;
          const formData = new FormData();
          formData.append('file', fileToUpload);
          try {
            const uploadRes = await api.post('/storage/upload', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            fileIds.push(uploadRes.data.id);
          } catch (uploadErr) {
            console.error('File upload error:', uploadErr);
          }
        }
      }

      const res = await api.post('/tickets', {
        title: values.subject,
        description: values.description,
        category: values.category,
        priority: mapFrontendPriorityToBackend(values.priority) || 'MEDIUM',
        company: values.company,
        phone: values.phone,
        email: values.email,
        section: values.section,
        fileIds,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setModalOpen(false);
      apiNotification.success({
        message: 'Заявка зарегистрирована',
        description: 'Ваша заявка успешно добавлена в реестр.',
        placement: 'bottomRight',
        duration: 5
      });
    },
    onError: (err: any) => {
      apiNotification.error({
        message: 'Ошибка создания заявки',
        description: err.response?.data?.message || 'Что-то пошло не так при создании заявки.',
        placement: 'bottomRight',
        duration: 5
      });
    }
  });

  // Update Ticket Details Mutation (e.g. line2, line3, resolution, section)
  const updateTicketMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (!selectedTicketId) return;
      const res = await api.put(`/tickets/${selectedTicketId}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', selectedTicketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      message.success('Данные заявки успешно обновлены');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Не удалось обновить данные заявки');
    }
  });

  // Add Comment Mutation
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
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Не удалось отправить комментарий');
    }
  });

  // Change Status Mutation
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
      message.success('Статус заявки обновлен');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Не удалось обновить статус');
    }
  });

  // Accept Ticket Mutation
  const acceptTicketMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTicketId) return;
      const res = await api.put(`/tickets/${selectedTicketId}/accept`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', selectedTicketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      message.success('Вы успешно приняли заявку в работу');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Не удалось принять заявку');
    }
  });

  // --- Handlers ---

  // Excel Export Handler
  const handleExportExcel = async () => {
    setExporting(true);
    message.loading({ content: 'Генерация файла Excel...', key: 'export_key' });
    
    try {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== 'all') {
        const backendStatus = mapFrontendStatusToBackend(filters.status);
        if (backendStatus) params.append('status', backendStatus);
      }
      if (filters.priority && filters.priority !== 'all') {
        const backendPriority = mapFrontendPriorityToBackend(filters.priority);
        if (backendPriority) params.append('priority', backendPriority);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.append('startDate', dayjs(filters.dateRange[0]).startOf('day').toISOString());
        params.append('endDate', dayjs(filters.dateRange[1]).endOf('day').toISOString());
      }
      params.append('category', activeTab);

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

      message.destroy('export_key');
      apiNotification.success({
        message: 'Экспорт завершен',
        description: 'Файл успешно сгенерирован и загружен на устройство.',
        icon: <FileExcelOutlined style={{ color: '#52c41a' }} />,
        placement: 'bottomRight',
        duration: 4.5
      });
    } catch (error) {
      console.error('Failed to export tickets:', error);
      message.destroy('export_key');
      message.error('Ошибка при экспорте заявок');
    } finally {
      setExporting(false);
    }
  };

  const handleViewDetails = (ticket: TicketType) => {
    setSelectedTicketId(ticket.id);
    router.replace(`/tickets?id=${ticket.id}`);
  };

  const handleCloseDrawer = () => {
    setSelectedTicketId(null);
    setIsStatusChanging(false);
    setNewStatusValue('');
    setStatusComment('');
    router.replace('/tickets');
  };

  // Render Status Tags in Drawer
  const getDetailStatusTag = (status?: string) => {
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

  const getDetailPriorityBadge = (priority?: string) => {
    if (!priority) return null;
    switch (priority) {
      case 'Высокий': return <Badge status="error" text={<span className="text-red-500 font-bold">Высокий приоритет</span>} />;
      case 'Средний': return <Badge status="warning" text={<span className="text-amber-500 font-medium">Средний приоритет</span>} />;
      case 'Низкий': return <Badge status="default" text={<span className="text-slate-500">Низкий приоритет</span>} />;
      default: return <Badge status="default" text={priority} />;
    }
  };

  const drawerOpen = !!selectedTicketId;

  return (
    <div className="flex flex-col gap-6 relative">
      {contextHolder}

      {/* Decorative glows */}
      <div className="bg-glow-blue top-0 left-0" />
      <div className="bg-glow-purple bottom-10 right-10" />

      {/* Header and Action Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div>
          <Title level={2} className="text-slate-850 font-bold m-0 tracking-tight">{t('ticketsTitle')}</Title>
          <Text className="text-slate-500 text-sm font-semibold mt-1 block">
            {t('ticketsSubtitle')}
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
            {t('exportExcel')}
          </Button>
          
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 border-none px-5 rounded-lg font-semibold shadow-sm h-10 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {t('createTicket')}
          </Button>
        </Space>
      </div>

      {/* Filters Form */}
      <div className="relative z-10">
        <TicketFilters onFilterChange={(newFilters) => setFilters(newFilters)} />
      </div>

      {/* Main Tickets Table */}
      <div className="relative z-10 flex flex-col">
        <TicketTable 
          dataSource={tickets} 
          loading={isTicketsLoading}
          onViewDetails={handleViewDetails}
          activeTab={activeTab}
        />
        
        {/* Bottom Tab Bar (Excel style) */}
        <div className="flex bg-[#8ba4bc] border border-t-0 border-[#dfe1e6]/65 rounded-b-2xl p-1 gap-1 -mt-1 shadow-md z-10 overflow-x-auto">
          {[
            { key: 'по НБД', label: 'по НБД' },
            { key: 'по ОС', label: 'по ОС' },
            { key: 'АСМ', label: 'АСМ' },
            { key: 'ГУК', label: 'ГУК' },
            { key: 'ГКО', label: 'ГКО' },
            { key: 'РВПЗ', label: 'РВПЗ' },
            { key: 'ПЭК', label: 'ПЭК' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-1 text-xs font-bold transition-all rounded-lg cursor-pointer border-t border-l border-r ${
                activeTab === tab.key
                  ? 'bg-white text-slate-800 border-slate-300 shadow-sm relative z-20 font-extrabold'
                  : 'bg-[#5c7b9c] text-white border-transparent hover:bg-[#6c8bac] font-semibold'
              }`}
              style={{
                borderRadius: '6px 6px 0 0',
                boxShadow: activeTab === tab.key ? '0 -2px 5px rgba(0,0,0,0.05)' : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Create Ticket Modal */}
      <CreateTicketModal 
        open={modalOpen} 
        onCancel={() => setModalOpen(false)} 
        onSubmit={(values) => createTicketMutation.mutate(values)}
      />

      {/* High-Fidelity Details Side Drawer */}
      <Drawer
        title={
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 -mt-2 w-full">
            <span className="text-slate-800 font-bold text-base">Өтінім мәліметтері</span>
            {ticketDetails && getDetailStatusTag(mapBackendStatusToFrontend(ticketDetails.status))}
          </div>
        }
        placement="right"
        onClose={handleCloseDrawer}
        open={drawerOpen}
        width={550}
        styles={{
          header: { background: '#ffffff', borderBottom: '1px solid #dfe1e6' },
          body: { background: '#ffffff', color: '#172b4d' }
        }}
      >
        {isDetailsLoading ? (
          <div className="flex justify-center items-center h-48">
            <Text className="text-slate-400">Жүктелуде...</Text>
          </div>
        ) : ticketDetails ? (
          <div className="flex flex-col gap-6 text-xs font-semibold">
            
            {/* Subject card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                Өтінім тақырыбы
              </span>
              <div className="text-slate-800 font-bold text-base leading-snug">
                {ticketDetails.title}
              </div>
              <div className="mt-3 flex items-center gap-4">
                {getDetailPriorityBadge(mapBackendPriorityToFrontend(ticketDetails.priority))}
                <Tag className="bg-slate-100 border-none text-slate-650 px-2 rounded">
                  Санаты: {ticketDetails.category}
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
                <span className="font-mono">{dayjs(ticketDetails.createdAt).format('DD.MM.YYYY HH:mm')}</span>
              </Descriptions.Item>
              <Descriptions.Item label="ФИО / Компания">
                <span className="font-bold text-slate-800">
                  {ticketDetails.company || (ticketDetails.creator ? `${ticketDetails.creator.firstName} ${ticketDetails.creator.lastName}` : '—')}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Контакты (Тел/Email)">
                <span>
                  {ticketDetails.phone || '—'} / {ticketDetails.email || ticketDetails.creator?.email || '—'}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Жауапты">
                <Space>
                  <UserOutlined className="text-slate-400" />
                  <span>
                    {ticketDetails.assignee 
                      ? `${ticketDetails.assignee.firstName} ${ticketDetails.assignee.lastName}` 
                      : <span className="text-slate-400 italic font-normal">Тағайындалмаған</span>
                    }
                  </span>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Авторы">
                <span>{ticketDetails.creator?.firstName} {ticketDetails.creator?.lastName} ({ticketDetails.creator?.email})</span>
              </Descriptions.Item>
            </Descriptions>

            {/* Problem Description */}
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">
                Мәселенің толық сипаттамасы
              </span>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-650 leading-relaxed whitespace-pre-line font-medium">
                {ticketDetails.description}
              </div>
            </div>

            {/* Attached Documents section */}
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2 flex items-center gap-1">
                <FolderOpenOutlined className="text-blue-500" />
                Тіркелген құжаттар
              </span>
              <div className="flex flex-wrap gap-2">
                {ticketDetails.files && ticketDetails.files.length > 0 ? (
                  ticketDetails.files.map((file: any) => {
                    const baseUrl = api.defaults.baseURL || 'http://localhost:3001';
                    return (
                      <Tag 
                        key={file.id}
                        icon={file.mimeType?.startsWith('image/') ? <CheckCircleOutlined className="text-green-600" /> : <FilePdfOutlined className="text-red-500" />} 
                        className="px-3 py-1 bg-slate-50 border-slate-200 text-slate-600 font-semibold rounded-lg cursor-pointer hover:border-slate-400 transition-all"
                        onClick={() => window.open(`${baseUrl}${file.url}`, '_blank')}
                      >
                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </Tag>
                    );
                  })
                ) : (
                  <span className="text-slate-400 italic font-normal">Тіркелген файлдар жоқ</span>
                )}
              </div>
            </div>

            {/* Tech Support Lines & Resolution Editing for operators/admins */}
            {(user?.role === 'OPERATOR' || user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Технические линии и Решение (IAC)
                </span>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1 font-bold">2-линия (примечания):</label>
                    <Input
                      placeholder="Введите данные для 2-линии..."
                      defaultValue={ticketDetails.line2 || ''}
                      onBlur={(e) => {
                        if (e.target.value !== (ticketDetails.line2 || '')) {
                          updateTicketMutation.mutate({ line2: e.target.value });
                        }
                      }}
                      className="bg-white border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1 font-bold">3-линия (примечания):</label>
                    <Input
                      placeholder="Введите данные для 3-линии..."
                      defaultValue={ticketDetails.line3 || ''}
                      onBlur={(e) => {
                        if (e.target.value !== (ticketDetails.line3 || '')) {
                          updateTicketMutation.mutate({ line3: e.target.value });
                        }
                      }}
                      className="bg-white border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1 font-bold">Раздел / тип вопроса:</label>
                    <Input
                      placeholder="сайт НБД, доступ..."
                      defaultValue={ticketDetails.section || ''}
                      onBlur={(e) => {
                        if (e.target.value !== (ticketDetails.section || '')) {
                          updateTicketMutation.mutate({ section: e.target.value });
                        }
                      }}
                      className="bg-white border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1 font-bold">Решение (Resolution):</label>
                    <Input.TextArea
                      placeholder="Опишите принятое решение..."
                      defaultValue={ticketDetails.resolution || ''}
                      rows={2}
                      onBlur={(e) => {
                        if (e.target.value !== (ticketDetails.resolution || '')) {
                          updateTicketMutation.mutate({ resolution: e.target.value });
                        }
                      }}
                      className="bg-white border-slate-200 rounded-lg text-xs font-semibold text-emerald-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Read-only view for regular employees */}
            {!(user?.role === 'OPERATOR' || user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Ход решения (IAC)
                </span>
                <Descriptions column={1} size="small" bordered className="custom-descriptions rounded-lg overflow-hidden text-xs">
                  <Descriptions.Item label="2-линия">{ticketDetails.line2 || <span className="text-slate-400 font-normal italic">Пусто</span>}</Descriptions.Item>
                  <Descriptions.Item label="3-линия">{ticketDetails.line3 || <span className="text-slate-400 font-normal italic">Пусто</span>}</Descriptions.Item>
                  <Descriptions.Item label="Решение">{ticketDetails.resolution || <span className="text-slate-400 font-normal italic">В процессе</span>}</Descriptions.Item>
                </Descriptions>
              </div>
            )}

            {/* Action Toolbar for Operators */}
            {(user?.role === 'OPERATOR' || user?.role === 'ADMIN') && (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Действия с заявкой</span>
                
                <div className="flex flex-col gap-2">
                  {/* Operator Accept action */}
                  {ticketDetails.status === 'NEW' && (
                    <Button
                      type="primary"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 border-none font-bold text-xs"
                      onClick={() => acceptTicketMutation.mutate()}
                      loading={acceptTicketMutation.isPending}
                    >
                      Принять в работу
                    </Button>
                  )}

                  {/* Change Status Dropdown */}
                  <div className="flex gap-2">
                    <select
                      value={newStatusValue || ticketDetails.status}
                      onChange={(e) => {
                        setNewStatusValue(e.target.value);
                        setIsStatusChanging(true);
                      }}
                      className="flex-1 bg-slate-850 border border-slate-700 rounded-lg p-2 text-xs font-bold text-white outline-none"
                    >
                      <option value="NEW">Новая (NEW)</option>
                      <option value="ACCEPTED">Принята (ACCEPTED)</option>
                      <option value="IN_PROGRESS">В работе (IN_PROGRESS)</option>
                      <option value="PENDING_APPROVAL">На согласовании (PENDING_APPROVAL)</option>
                      <option value="CLOSED">Закрыта (CLOSED)</option>
                      <option value="REJECTED">Отклонена (REJECTED)</option>
                    </select>
                  </div>

                  {isStatusChanging && (
                    <div className="space-y-2 mt-2 pt-2 border-t border-slate-800 animate-fade-in">
                      <Input.TextArea
                        placeholder="Причина смены статуса (комментарий)..."
                        value={statusComment}
                        onChange={(e) => setStatusComment(e.target.value)}
                        className="bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-650 rounded-lg text-xs"
                        rows={2}
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="small"
                          onClick={() => setIsStatusChanging(false)}
                          className="bg-slate-800 hover:bg-slate-750 border-none text-slate-450 text-[10px]"
                        >
                          Отмена
                        </Button>
                        <Button
                          type="primary"
                          size="small"
                          className="bg-blue-600 hover:bg-blue-700 border-none text-white text-[10px]"
                          onClick={() => updateStatusMutation.mutate({ status: newStatusValue, comment: statusComment })}
                          loading={updateStatusMutation.isPending}
                        >
                          Сменить статус
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Divider className="border-slate-250 m-0" />

            {/* Comments Timeline */}
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-4">
                История и обсуждение
              </span>
              <Timeline
                mode="left"
                className="custom-timeline mt-2"
                items={
                  ticketDetails.comments && ticketDetails.comments.length > 0 ? (
                    ticketDetails.comments.map((comment: any) => {
                      const isSystem = comment.text.startsWith('[Система]') || comment.text.startsWith('[Согласование]');
                      return {
                        color: isSystem ? 'blue' : 'green',
                        children: (
                          <div className="mb-2">
                            <div className="flex justify-between items-center text-[9px] text-slate-400 font-semibold mb-0.5">
                              <span className="text-slate-650 font-bold">
                                {comment.author ? `${comment.author.firstName} ${comment.author.lastName}` : 'Система'}
                              </span>
                              <span>
                                {dayjs(comment.createdAt).format('DD.MM.YYYY HH:mm')}
                              </span>
                            </div>
                            <p className={`text-[11px] leading-relaxed m-0 ${isSystem ? 'text-slate-500 font-semibold' : 'text-slate-700 font-medium'}`}>
                              {comment.text}
                            </p>
                          </div>
                        )
                      };
                    })
                  ) : (
                    [
                      {
                        color: 'gray',
                        children: (
                          <div>
                            <Text strong className="text-slate-700 text-xs block">Өтінім жүйеге сәтті тіркелді</Text>
                            <span className="text-[10px] text-slate-400 block font-mono">{dayjs(ticketDetails.createdAt).format('DD.MM.YYYY HH:mm')}</span>
                          </div>
                        ),
                      }
                    ]
                  )
                }
              />
            </div>

            {/* Comment Input Footer */}
            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <Input
                placeholder="Напишите комментарий..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onPressEnter={() => {
                  if (commentText.trim()) {
                    addCommentMutation.mutate(commentText);
                  }
                }}
                className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl"
              />
              <Button 
                type="primary"
                icon={<SendOutlined />}
                className="bg-blue-600 hover:bg-blue-700 border-none rounded-xl flex items-center justify-center"
                onClick={() => {
                  if (commentText.trim()) {
                    addCommentMutation.mutate(commentText);
                  }
                }}
                loading={addCommentMutation.isPending}
              >
                Отправить
              </Button>
            </div>
            
          </div>
        ) : (
          <div className="flex justify-center items-center h-48">
            <Text className="text-slate-400">Деректер табылмады</Text>
          </div>
        )}
      </Drawer>
    </div>
  );
}
