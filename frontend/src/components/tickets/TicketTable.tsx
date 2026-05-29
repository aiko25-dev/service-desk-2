'use client';

import React from 'react';
import { Table, Tag, Badge, Button, Space, Tooltip, message, Typography } from 'antd';
import { CopyOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

export interface TicketType {
  key: string;
  id: string;
  subject: string;
  category: string;
  priority: 'Высокий' | 'Средний' | 'Низкий';
  status: 'Новая' | 'Принята' | 'В работе' | 'На согласовании' | 'Закрыта' | 'Отклонена';
  assignee: string;
  createdAt: string;
  description?: string;
}

interface TicketTableProps {
  dataSource: TicketType[];
  loading?: boolean;
  onViewDetails?: (ticket: TicketType) => void;
}

export default function TicketTable({ dataSource, loading = false, onViewDetails }: TicketTableProps) {

  // Copy ID to clipboard
  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    message.success(`ID заявки ${id} скопирован в буфер обмена`);
  };

  // Status mapping to AntD tags & custom colors
  const getStatusTag = (status: TicketType['status']) => {
    switch (status) {
      case 'Новая':
        return <Tag color="default" className="border-none px-2.5 py-0.5 rounded font-semibold text-slate-300 bg-slate-800">Новая</Tag>;
      case 'Принята':
        return <Tag color="blue" className="border-none px-2.5 py-0.5 rounded font-semibold text-blue-400 bg-blue-500/10">Принята</Tag>;
      case 'В работе':
        return <Tag color="warning" className="border-none px-2.5 py-0.5 rounded font-semibold text-amber-400 bg-amber-500/10">В работе</Tag>;
      case 'На согласовании':
        return <Tag color="purple" className="border-none px-2.5 py-0.5 rounded font-semibold text-purple-400 bg-purple-500/10">На согласовании</Tag>;
      case 'Закрыта':
        return <Tag color="success" className="border-none px-2.5 py-0.5 rounded font-semibold text-green-400 bg-green-500/10">Закрыта</Tag>;
      case 'Отклонена':
        return <Tag color="error" className="border-none px-2.5 py-0.5 rounded font-semibold text-red-400 bg-red-500/10">Отклонена</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  // Priority mapping to Badge status
  const getPriorityBadge = (priority: TicketType['priority']) => {
    switch (priority) {
      case 'Высокий':
        return <Badge status="error" text={<span className="text-red-400 font-semibold">Высокий</span>} />;
      case 'Средний':
        return <Badge status="warning" text={<span className="text-amber-400 font-medium">Средний</span>} />;
      case 'Низкий':
        return <Badge status="default" text={<span className="text-slate-400">Низкий</span>} />;
      default:
        return <Badge status="default" text={priority} />;
    }
  };

  // Categories mapping to beautiful badges
  const getCategoryTag = (category: string) => {
    switch (category) {
      case 'IT':
        return <Tag className="border-slate-800 bg-slate-900/60 text-slate-300">IT</Tag>;
      case 'HR':
        return <Tag className="border-magenta-900/30 bg-magenta-500/10 text-magenta-300">HR</Tag>;
      case 'Бухгалтерия':
        return <Tag className="border-cyan-900/30 bg-cyan-500/10 text-cyan-300">Бухгалтерия</Tag>;
      default:
        return <Tag>{category}</Tag>;
    }
  };

  const columns: ColumnsType<TicketType> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: '120px',
      sorter: (a, b) => a.id.localeCompare(b.id),
      render: (id) => (
        <Space className="font-mono text-slate-300 text-xs">
          <span>{id}</span>
          <Tooltip title="Копировать ID">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined className="text-slate-500 hover:text-white text-[11px]" />}
              onClick={(e) => handleCopyId(id, e)}
              className="flex items-center justify-center hover:bg-slate-800 p-0 w-5 h-5 min-w-[20px] rounded"
            />
          </Tooltip>
        </Space>
      )
    },
    {
      title: 'Тема обращения',
      dataIndex: 'subject',
      key: 'subject',
      ellipsis: true,
      render: (subject, record) => (
        <span 
          onClick={() => onViewDetails?.(record)}
          className="text-white font-semibold cursor-pointer hover:text-blue-400 hover:underline transition-colors block py-0.5"
        >
          {subject}
        </span>
      )
    },
    {
      title: 'Категория',
      dataIndex: 'category',
      key: 'category',
      width: '140px',
      render: (category) => getCategoryTag(category)
    },
    {
      title: 'Приоритет',
      dataIndex: 'priority',
      key: 'priority',
      width: '130px',
      sorter: (a, b) => {
        const priorityWeight = { 'Низкий': 1, 'Средний': 2, 'Высокий': 3 };
        return priorityWeight[a.priority] - priorityWeight[b.priority];
      },
      render: (priority) => getPriorityBadge(priority)
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: '170px',
      sorter: (a, b) => a.status.localeCompare(b.status),
      render: (status) => getStatusTag(status)
    },
    {
      title: 'Исполнитель',
      dataIndex: 'assignee',
      key: 'assignee',
      width: '180px',
      render: (assignee) => (
        <span className="text-slate-300 font-medium text-xs">
          {assignee || <span className="text-slate-500 italic">Не назначен</span>}
        </span>
      )
    },
    {
      title: 'Создана',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: '130px',
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (date) => (
        <span className="text-slate-400 text-xs font-mono">
          {date}
        </span>
      )
    },
    {
      title: 'Действия',
      key: 'actions',
      width: '100px',
      render: (_, record) => (
        <Button
          type="text"
          icon={<EyeOutlined className="text-slate-400 hover:text-white" />}
          onClick={() => onViewDetails?.(record)}
          className="flex items-center justify-center hover:bg-slate-800 rounded-lg w-8 h-8"
        />
      )
    }
  ];

  return (
    <div className="rounded-2xl border border-slate-800/40 overflow-hidden shadow-xl glass-panel">
      <Table
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        pagination={{
          defaultPageSize: 8,
          showSizeChanger: true,
          pageSizeOptions: ['5', '8', '15', '30'],
          showTotal: (total, range) => (
            <span className="text-slate-400 text-xs font-semibold">
              Показано {range[0]}-{range[1]} из {total} заявок
            </span>
          )
        }}
        className="w-full"
        onRow={(record) => ({
          onClick: () => onViewDetails?.(record),
          className: 'cursor-pointer'
        })}
      />
    </div>
  );
}
