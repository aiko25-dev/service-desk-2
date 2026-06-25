'use client';

import React from 'react';
import { Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

export interface TicketType {
  key: string;
  id: string;
  subject: string;
  category: string;
  priority: 'Высокий' | 'Средний' | 'Низкий';
  status: 'Новая' | 'Принята' | 'В работе' | 'На согласовании' | 'Закрыта' | 'Отклонена' | 'Опубликован';
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
  activeTab?: string;
}

export default function TicketTable({ dataSource, loading = false, onViewDetails, activeTab = 'по НБД' }: TicketTableProps) {

  // 1. DEFAULT COLUMNS (Used for по НБД, АСМ, ГУК, ГКО, РВПЗ, ПЭК)
  const defaultColumns: ColumnsType<TicketType> = [
    {
      title: '№',
      key: 'index',
      width: '60px',
      render: (_, __, index) => (
        <span className="text-slate-800 font-bold text-xs">{index + 1}</span>
      )
    },
    {
      title: 'ФИО, Наименования предприятия, ИП, ТОО',
      dataIndex: 'company',
      key: 'company',
      width: '240px',
      render: (company) => (
        <span className="text-slate-800 font-semibold block whitespace-normal leading-tight text-xs" title={company}>
          {company || '—'}
        </span>
      )
    },
    {
      title: 'Номер телефона, почта',
      key: 'contact',
      width: '180px',
      render: (_, record) => (
        <div className="flex flex-col text-[11px] text-slate-700 leading-tight">
          <span className="font-semibold">{record.phone || '—'}</span>
          <span className="text-slate-500">{record.email || '—'}</span>
        </div>
      )
    },
    {
      title: 'ФИО ответственный (ИАЦ)',
      dataIndex: 'assignee',
      key: 'assignee',
      width: '185px',
      render: (assignee) => (
        <span className="text-slate-800 font-semibold text-xs">
          {assignee || <span className="text-slate-400 italic font-normal">Не назначен</span>}
        </span>
      )
    },
    {
      title: '1- линия (тех проблема)',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      width: '320px',
      render: (desc, record) => (
        <span 
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails?.(record);
          }}
          className="text-slate-800 font-normal cursor-pointer hover:text-blue-650 hover:underline transition-colors block py-0.5 whitespace-normal leading-normal text-xs"
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
      width: '90px',
      render: (line2) => (
        <span className="text-slate-700 text-xs truncate block" title={line2}>{line2 || '—'}</span>
      )
    },
    {
      title: '3-линия',
      dataIndex: 'line3',
      key: 'line3',
      width: '90px',
      render: (line3) => (
        <span className="text-slate-700 text-xs truncate block" title={line3}>{line3 || '—'}</span>
      )
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: '130px',
      sorter: (a, b) => a.status.localeCompare(b.status),
      onCell: () => {
        if (activeTab === 'ГУК' || activeTab === 'ГКО') {
          return { style: { backgroundColor: '#ffff00', color: '#000000' } };
        }
        return {};
      },
      render: (status) => {
        const isClosed = status === 'Closed' || status === 'CLOSED' || status === 'Закрыта';
        const displayText = isClosed ? 'Отработано' : (status === 'Опубликован' ? 'Опубликован' : 'в работе');
        return <span className="text-slate-800 font-semibold text-xs">{displayText}</span>;
      }
    },
    {
      title: 'Тип вопроса, раздел',
      dataIndex: 'section',
      key: 'section',
      width: '150px',
      render: (section, record) => (
        <span className="text-slate-700 text-xs font-semibold">{section || record.category || '—'}</span>
      )
    },
    {
      title: 'Решение',
      dataIndex: 'resolution',
      key: 'resolution',
      width: '220px',
      onCell: () => {
        if (activeTab === 'ГКО') {
          return { style: { backgroundColor: '#ffff00', color: '#000000' } };
        }
        return {};
      },
      render: (resolution) => {
        return <span className="text-slate-800 font-semibold text-xs leading-tight block whitespace-normal" title={resolution}>{resolution || '—'}</span>;
      }
    },
    {
      title: 'Дата',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: '110px',
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (date) => (
        <span className="text-slate-700 text-xs font-mono">
          {date}
        </span>
      )
    }
  ];

  // 2. ALTERNATIVE COLUMNS (Used ONLY for по ОС)
  const osColumns: ColumnsType<TicketType> = [
    {
      title: 'Столбец',
      key: 'index',
      width: '70px',
      render: (_, __, index) => (
        <span className="text-slate-800 font-bold text-xs">{index + 1}</span>
      )
    },
    {
      title: 'Область/инициатор/номер (почта)',
      key: 'contactInfo',
      width: '320px',
      render: (_, record) => {
        const parts = [];
        if (record.phone) parts.push(record.phone);
        if (record.company) parts.push(record.company);
        if (record.email) parts.push(record.email);
        return (
          <span className="text-slate-800 font-semibold block whitespace-normal leading-snug text-xs">
            {parts.join(' ') || '—'}
          </span>
        );
      }
    },
    {
      title: 'Вид вопроса',
      dataIndex: 'section',
      key: 'section',
      width: '180px',
      render: (section, record) => (
        <span className="text-slate-700 font-semibold text-xs">
          {section || record.category || '—'}
        </span>
      )
    },
    {
      title: 'Дата',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: '110px',
      render: (date) => (
        <span className="text-slate-700 text-xs font-mono">
          {date}
        </span>
      )
    },
    {
      title: 'Вопрос',
      dataIndex: 'description',
      key: 'description',
      width: '320px',
      render: (desc, record) => (
        <span 
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails?.(record);
          }}
          className="text-slate-800 font-normal cursor-pointer hover:text-blue-650 hover:underline transition-colors block py-0.5 whitespace-normal leading-normal text-xs"
          title={desc}
        >
          {desc || '—'}
        </span>
      )
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: '130px',
      render: (status) => {
        const isClosed = status === 'Closed' || status === 'CLOSED' || status === 'Закрыта';
        const displayText = isClosed ? 'Отработано' : (status === 'Опубликован' ? 'Опубликован' : 'В работе');
        return <span className="text-slate-800 font-semibold text-xs">{displayText}</span>;
      }
    },
    {
      title: 'ФИО ответственный (ИАЦ)',
      dataIndex: 'assignee',
      key: 'assignee',
      width: '220px',
      render: (assignee) => (
        <span className="text-slate-800 font-semibold block whitespace-normal leading-tight text-xs">
          {assignee ? `${assignee} входящий` : <span className="text-slate-400 italic font-normal">Не назначен</span>}
        </span>
      )
    },
    {
      title: 'Столбец 1',
      key: 'col1',
      width: '100px',
      render: () => <span className="text-slate-400">—</span>
    }
  ];

  const columns = activeTab === 'по ОС' ? osColumns : defaultColumns;

  return (
    <div className="rounded-t-2xl border border-slate-300 overflow-hidden shadow-xl excel-table bg-white">
      <Table
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        scroll={{ x: 'max-content' }}
        pagination={{
          defaultPageSize: 8,
          showSizeChanger: true,
          pageSizeOptions: ['5', '8', '15', '30'],
          showTotal: (total, range) => (
            <span className="text-slate-650 text-xs font-semibold px-4">
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
