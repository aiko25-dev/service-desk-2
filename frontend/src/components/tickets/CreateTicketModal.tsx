'use client';

import React, { useState } from 'react';
import { Modal, Form, Input, Select, Upload, message, Button, Space } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps, UploadFile } from 'antd';

const { TextArea } = Input;
const { Dragger } = Upload;

interface CreateTicketModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: any) => void;
}

export default function CreateTicketModal({ open, onCancel, onSubmit }: CreateTicketModalProps) {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      
      // Simulate API lag
      setTimeout(() => {
        onSubmit({
          ...values,
          files: fileList
        });
        form.resetFields();
        setFileList([]);
        setSubmitting(false);
      }, 800);
      
    } catch (error) {
      console.log('Validate Failed:', error);
    }
  };

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: true,
    fileList,
    beforeUpload: (file) => {
      // 1. Limit size to 50MB
      const isLt50M = file.size / 1024 / 1024 < 50;
      if (!isLt50M) {
        message.error(`Файл ${file.name} превышает допустимый лимит 50 МБ!`);
        return Upload.LIST_IGNORE;
      }

      // 2. Validate file type
      const allowedExtensions = ['.pdf', '.docx', '.xlsx', '.png', '.jpg', '.jpeg', '.gif'];
      const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      const isAllowed = allowedExtensions.includes(fileExt) || file.type.startsWith('image/');
      
      if (!isAllowed) {
        message.error(`Недопустимый формат файла ${file.name}! Разрешены только .pdf, .docx, .xlsx и изображения.`);
        return Upload.LIST_IGNORE;
      }

      setFileList((prev) => [...prev, file]);
      message.success(`Файл ${file.name} успешно добавлен.`);
      return false; // Prevent automatic upload
    },
    onRemove: (file) => {
      setFileList((prev) => prev.filter((item) => item.uid !== file.uid));
    }
  };

  return (
    <Modal
      open={open}
      title={
        <span className="text-white font-bold text-lg block mb-2 border-b border-slate-800/40 pb-2">
          Создание новой заявки
        </span>
      }
      okText="Создать заявку"
      cancelText="Отмена"
      onCancel={() => {
        form.resetFields();
        setFileList([]);
        onCancel();
      }}
      onOk={handleOk}
      confirmLoading={submitting}
      width={600}
      styles={{
        mask: {
          backdropFilter: 'blur(4px)',
          background: 'rgba(2, 6, 23, 0.6)'
        }
      }}
      className="ticket-modal"
    >
      <Form
        form={form}
        layout="vertical"
        name="create_ticket_form"
        initialValues={{ priority: 'Средний', category: 'IT' }}
        className="mt-4"
      >
        <Form.Item
          name="subject"
          label={<span className="text-slate-300 font-semibold text-sm">Тема обращения</span>}
          rules={[{ required: true, message: 'Пожалуйста, введите тему заявки!' }]}
        >
          <Input 
            placeholder="Кратко опишите проблему..." 
            className="bg-slate-900/50 hover:bg-slate-900 border-slate-800 focus:border-blue-500 text-slate-100 rounded-lg h-10"
          />
        </Form.Item>

        <Form.Item
          name="description"
          label={<span className="text-slate-300 font-semibold text-sm">Описание проблемы</span>}
          rules={[{ required: true, message: 'Пожалуйста, подробно опишите вашу проблему!' }]}
        >
          <TextArea 
            rows={4} 
            placeholder="Укажите детали обращения, симптомы проблемы или шаги для воспроизведения сбоя..." 
            className="bg-slate-900/50 hover:bg-slate-900 border-slate-800 focus:border-blue-500 text-slate-100 rounded-lg"
          />
        </Form.Item>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Form.Item
            name="category"
            label={<span className="text-slate-300 font-semibold text-sm">Категория</span>}
            rules={[{ required: true }]}
          >
            <Select className="custom-select rounded-lg h-10">
              <Select.Option value="IT">IT (Техническая поддержка)</Select.Option>
              <Select.Option value="HR">HR (Кадровая служба)</Select.Option>
              <Select.Option value="Бухгалтерия">Бухгалтерия (Счета и налоги)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="priority"
            label={<span className="text-slate-300 font-semibold text-sm">Приоритет</span>}
            rules={[{ required: true }]}
          >
            <Select className="custom-select rounded-lg h-10">
              <Select.Option value="Высокий">Высокий</Select.Option>
              <Select.Option value="Средний">Средний</Select.Option>
              <Select.Option value="Низкий">Низкий</Select.Option>
            </Select>
          </Form.Item>
        </div>

        <Form.Item
          label={<span className="text-slate-300 font-semibold text-sm">Прикрепить файлы (Макс. 50 МБ)</span>}
          extra={<span className="text-slate-500 text-xs mt-1 block">Допустимые форматы: .pdf, .docx, .xlsx и изображения</span>}
        >
          <Dragger 
            {...uploadProps}
            className="border-dashed border-slate-800 hover:border-blue-500/50 bg-slate-900/35 rounded-xl py-6 transition-all"
          >
            <p className="ant-upload-drag-icon text-center mb-1 text-slate-400">
              <InboxOutlined className="text-4xl text-blue-500/80" />
            </p>
            <p className="ant-upload-text text-slate-300 font-semibold text-sm text-center">
              Нажмите или перетащите файлы для загрузки
            </p>
            <p className="ant-upload-hint text-slate-500 text-xs text-center px-4">
              Поддерживается загрузка нескольких файлов. Файлы проверяются на безопасность.
            </p>
          </Dragger>
        </Form.Item>
      </Form>
    </Modal>
  );
}
