'use client';

import React from 'react';
import { Row, Col, Card, Statistic, Typography } from 'antd';
import {
  FileTextOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';

const { Text } = Typography;

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  trend: string;
  isUp: boolean;
  subtext: string;
}

const StatCard = ({ title, value, icon, color, bgColor, trend, isUp, subtext }: StatCardProps) => {
  return (
    <Card 
      className="glass-panel glass-panel-hover border border-slate-800/40 relative overflow-hidden" 
      styles={{ body: { padding: '24px' } }}
    >
      {/* Decorative background glow matching the card's theme */}
      <div 
        className="absolute -right-10 -bottom-10 w-28 h-28 rounded-full filter blur-2xl opacity-20 pointer-events-none"
        style={{ backgroundColor: color }}
      />
      
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <Text className="text-slate-400 font-medium text-sm tracking-wide mb-1 uppercase">
            {title}
          </Text>
          <Statistic 
            value={value} 
            styles={{
              content: {
                color: '#ffffff', 
                fontSize: '32px', 
                fontWeight: 700,
                lineHeight: 1.2
              }
            }} 
          />
        </div>
        <div 
          className="flex items-center justify-center w-12 h-12 rounded-xl text-xl shadow-inner shadow-black/10 transition-all duration-300"
          style={{ 
            color: color, 
            backgroundColor: bgColor,
            border: `1px solid ${color}20` 
          }}
        >
          {icon}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-5 pt-3 border-t border-slate-800/40">
        <span 
          className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded ${
            isUp ? 'text-green-400 bg-green-500/10' : 'text-slate-400 bg-slate-800/40'
          }`}
        >
          {isUp ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          {trend}
        </span>
        <Text className="text-slate-500 text-xs font-medium">
          {subtext}
        </Text>
      </div>
    </Card>
  );
};

export default function StatCards() {
  const stats = [
    {
      title: 'Всего заявок',
      value: 1248,
      icon: <FileTextOutlined />,
      color: '#1677ff', // Corporate Blue
      bgColor: 'rgba(22, 119, 255, 0.12)',
      trend: '+14.2%',
      isUp: true,
      subtext: 'по сравнению с прошлым месяцем'
    },
    {
      title: 'В работе',
      value: 84,
      icon: <SyncOutlined spin className="text-amber-400" />,
      color: '#faad14', // Yellow
      bgColor: 'rgba(250, 173, 20, 0.12)',
      trend: '+4 новые',
      isUp: true,
      subtext: 'за последние 24 часа'
    },
    {
      title: 'На согласовании',
      value: 29,
      icon: <ClockCircleOutlined />,
      color: '#722ed1', // Purple
      bgColor: 'rgba(114, 46, 209, 0.12)',
      trend: '-2.4%',
      isUp: false,
      subtext: 'среднее время: 4.5 часа'
    },
    {
      title: 'Закрыто',
      value: 1135,
      icon: <CheckCircleOutlined />,
      color: '#52c41a', // Green
      bgColor: 'rgba(82, 196, 26, 0.12)',
      trend: '97.2%',
      isUp: true,
      subtext: 'коэффициент решения SLA'
    }
  ];

  return (
    <Row gutter={[20, 20]} className="w-full">
      {stats.map((stat, idx) => (
        <Col xs={24} sm={12} xl={6} key={idx}>
          <StatCard {...stat} />
        </Col>
      ))}
    </Row>
  );
}
