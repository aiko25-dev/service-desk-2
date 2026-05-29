'use client';

import React from 'react';
import { Form, Input, Select, DatePicker, Button, Row, Col } from 'antd';
import { SearchOutlined, ClearOutlined, FilterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

interface TicketFiltersProps {
  onFilterChange: (filters: any) => void;
}

export default function TicketFilters({ onFilterChange }: TicketFiltersProps) {
  const [form] = Form.useForm();

  const handleValuesChange = (_ChangedValues: any, allValues: any) => {
    // When any filter changes, trigger the callback
    onFilterChange(allValues);
  };

  const handleReset = () => {
    form.resetFields();
    onFilterChange({
      search: '',
      status: 'all',
      priority: 'all',
      dateRange: null
    });
  };

  return (
    <Form
      form={form}
      name="ticket_filters"
      layout="vertical"
      onValuesChange={handleValuesChange}
      initialValues={{ status: 'all', priority: 'all' }}
      className="w-full p-5 rounded-2xl glass-panel border border-slate-800/40 shadow-md relative overflow-hidden"
    >
      {/* Visual background gradient accent */}
      <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-blue-500 to-indigo-600" />
      
      <Row gutter={[16, 12]} align="bottom">
        {/* Search */}
        <Col xs={24} md={8} lg={6}>
          <Form.Item
            name="search"
            label={<span className="text-slate-400 font-semibold text-xs tracking-wider uppercase">Поиск</span>}
            className="mb-0"
          >
            <Input
              placeholder="ID или тема обращения..."
              prefix={<SearchOutlined className="text-slate-500" />}
              allowClear
              className="bg-slate-900/50 hover:bg-slate-900 border-slate-800 focus:border-blue-500 text-slate-100 rounded-lg h-10"
            />
          </Form.Item>
        </Col>

        {/* Status */}
        <Col xs={12} sm={12} md={4} lg={4}>
          <Form.Item
            name="status"
            label={<span className="text-slate-400 font-semibold text-xs tracking-wider uppercase">Статус</span>}
            className="mb-0"
          >
            <Select className="custom-select rounded-lg h-10">
              <Select.Option value="all">Все статусы</Select.Option>
              <Select.Option value="Новая">Новая</Select.Option>
              <Select.Option value="Принята">Принята</Select.Option>
              <Select.Option value="В работе">В работе</Select.Option>
              <Select.Option value="На согласовании">На согласовании</Select.Option>
              <Select.Option value="Закрыта">Закрыта</Select.Option>
              <Select.Option value="Отклонена">Отклонена</Select.Option>
            </Select>
          </Form.Item>
        </Col>

        {/* Priority */}
        <Col xs={12} sm={12} md={4} lg={4}>
          <Form.Item
            name="priority"
            label={<span className="text-slate-400 font-semibold text-xs tracking-wider uppercase">Приоритет</span>}
            className="mb-0"
          >
            <Select className="custom-select rounded-lg h-10">
              <Select.Option value="all">Все приоритеты</Select.Option>
              <Select.Option value="Высокий">Высокий</Select.Option>
              <Select.Option value="Средний">Средний</Select.Option>
              <Select.Option value="Низкий">Низкий</Select.Option>
            </Select>
          </Form.Item>
        </Col>

        {/* Date Range Picker */}
        <Col xs={24} sm={16} md={8} lg={6}>
          <Form.Item
            name="dateRange"
            label={<span className="text-slate-400 font-semibold text-xs tracking-wider uppercase">Период создания</span>}
            className="mb-0"
          >
            <RangePicker 
              className="bg-slate-900/50 hover:bg-slate-900 border-slate-800 focus:border-blue-500 text-slate-100 rounded-lg w-full h-10"
              placeholder={['С даты', 'По дату']}
            />
          </Form.Item>
        </Col>

        {/* Reset Actions Button */}
        <Col xs={24} sm={8} md={24} lg={4} className="flex justify-end">
          <Button
            type="text"
            icon={<ClearOutlined />}
            onClick={handleReset}
            className="w-full lg:w-auto h-10 text-slate-400 hover:text-white bg-slate-900/40 hover:bg-slate-900 border border-slate-800 rounded-lg px-4 flex items-center justify-center gap-1.5 transition-all"
          >
            Сбросить
          </Button>
        </Col>
      </Row>
    </Form>
  );
}
