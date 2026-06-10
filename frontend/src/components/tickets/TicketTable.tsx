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
  company?: string;
  phone?: string;
  email?: string;
  line2?: string;
  line3?: string;
  section?: string;
  resolution?: string;
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

  const columns: ColumnsType<TicketType> = [
    {
      title: '№',
      key: 'index',
      width: '60px',
      render: (_, __, index) => (
        <span className="text-slate-300 font-semibold">{index + 1}</span>
      )
    },
    {
      title: 'ФИО, Наименования предприятия, ИП, ТОО',
      dataIndex: 'company',
      key: 'company',
      width: '240px',
      render: (company) => (
        <span className="text-white font-semibold block truncate" title={company}>
          {company || '—'}
        </span>
      )
    },
    {
      title: 'Номер телефона, почта',
      key: 'contact',
      width: '180px',
      render: (_, record) => (
        <div className="flex flex-col text-[11px] text-slate-300 leading-tight">
          <span className="font-semibold">{record.phone || '—'}</span>
          <span className="text-slate-500">{record.email || '—'}</span>
        </div>
      )
    },
    {
      title: 'ФИО ответственный (ИАЦ)',
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
      title: '1- линия (тех проблема)',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      width: '280px',
      render: (desc, record) => (
        <span 
          onClick={() => onViewDetails?.(record)}
          className="text-white font-medium cursor-pointer hover:text-blue-400 hover:underline transition-colors block py-0.5"
          title={desc}
        >
          {desc}
        </span>
      )
    },
    {
      title: '2-линия',
      dataIndex: 'line2',
      key: 'line2',
      width: '140px',
      render: (line2) => (
        <span className="text-slate-300 text-xs truncate block" title={line2}>{line2 || '—'}</span>
      )
    },
    {
      title: '3-линия',
      dataIndex: 'line3',
      key: 'line3',
      width: '140px',
      render: (line3) => (
        <span className="text-slate-300 text-xs truncate block" title={line3}>{line3 || '—'}</span>
      )
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: '130px',
      sorter: (a, b) => a.status.localeCompare(b.status),
      render: (status) => getStatusTag(status)
    },
    {
      title: 'Тип вопроса, раздел',
      dataIndex: 'section',
      key: 'section',
      width: '150px',
      render: (section, record) => (
        <span className="text-slate-300 text-xs font-semibold">{section || record.category || '—'}</span>
      )
    },
    {
      title: 'Решение',
      dataIndex: 'resolution',
      key: 'resolution',
      width: '180px',
      render: (resolution) => (
        <span className="text-emerald-400 text-xs font-semibold truncate block" title={resolution}>{resolution || '—'}</span>
      )
    },
    {
      title: 'Дата',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: '110px',
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (date) => (
        <span className="text-slate-400 text-xs font-mono">
          {date}
        </span>
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
