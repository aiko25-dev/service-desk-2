'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../hooks/useApi';
import { useAuthStore } from '../../store/authStore';
import { useState } from 'react';
import {
  CheckSquare,
  X,
  Check,
  Calendar,
  Wallet,
  Users,
  FileText,
  AlertCircle,
  MessageSquare
} from 'lucide-react';

export default function ApprovalsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Active step selection
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  
  // Action state comments
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Pending Approvals
  const { data: pending, isLoading } = useQuery({
    queryKey: ['pendingApprovals'],
    queryFn: async () => {
      const res = await api.get('/approvals/pending');
      return res.data;
    },
    enabled: !!user && (user.role === 'MANAGER' || user.role === 'ADMIN'),
  });

  // Action Approval Mutation
  const actionMutation = useMutation({
    mutationFn: async (data: { id: string; action: 'APPROVE' | 'REJECT'; comment: string }) => {
      const res = await api.put(`/approvals/${data.id}`, {
        action: data.action,
        comment: data.comment,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
      setSelectedStepId(null);
      setComment('');
    },
  });

  const handleAction = (action: 'APPROVE' | 'REJECT') => {
    if (!selectedStepId) return;
    actionMutation.mutate({
      id: selectedStepId,
      action,
      comment,
    });
  };

  const selectedStep = pending?.find((p: any) => p.id === selectedStepId);

  const typeMap: Record<string, string> = {
    VACATION: 'Отпуск сотрудника',
    HR_ORDER: 'Кадровый приказ',
    FINANCE: 'Выплата расходов',
    TICKET: 'Закрытие заявки',
  };

  const typeIcons: Record<string, any> = {
    VACATION: Calendar,
    HR_ORDER: Users,
    FINANCE: Wallet,
    TICKET: FileText,
  };

  const typeColors: Record<string, string> = {
    VACATION: 'text-blue-500 bg-blue-50 border-blue-100',
    HR_ORDER: 'text-teal-500 bg-teal-50 border-teal-100',
    FINANCE: 'text-emerald-500 bg-emerald-50 border-emerald-100',
    TICKET: 'text-purple-500 bg-purple-50 border-purple-100',
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-slate-400 text-sm">Загрузка очереди согласования...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6 relative animate-fade-in">
      {/* LEFT COLUMN: Pending Approvals list */}
      <div className="flex-1 flex flex-col min-w-0 premium-card p-5 h-full overflow-hidden justify-between">
        <div className="space-y-4 flex flex-col flex-1 overflow-hidden">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 shrink-0">
            <CheckSquare size={16} className="text-blue-500" />
            Очередь согласования Менеджера
          </h3>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {pending?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                <Check size={32} className="text-slate-300 border rounded-full p-1" />
                <span className="text-xs">Все заявки успешно согласованы!</span>
              </div>
            ) : (
              pending?.map((step: any) => {
                const isSelected = selectedStepId === step.id;
                const Icon = typeIcons[step.type] || FileText;
                return (
                  <div
                    key={step.id}
                    onClick={() => setSelectedStepId(step.id)}
                    className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 flex items-start gap-4 justify-between ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/20 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex gap-3 overflow-hidden">
                      <div className={`p-2.5 rounded-xl border shrink-0 ${typeColors[step.type]}`}>
                        <Icon size={18} />
                      </div>
                      <div className="space-y-1.5 overflow-hidden">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          {typeMap[step.type] || step.type}
                        </span>
                        
                        {step.type === 'VACATION' && (
                          <h4 className="text-xs font-bold text-slate-800 truncate">
                            Запрос отпуска: {step.details.employee.firstName} {step.details.employee.lastName}
                          </h4>
                        )}
                        {step.type === 'HR_ORDER' && (
                          <h4 className="text-xs font-bold text-slate-800 truncate">
                            Приказ: {step.details.title}
                          </h4>
                        )}
                        {step.type === 'FINANCE' && (
                          <h4 className="text-xs font-bold text-slate-800 truncate">
                            Компенсация {step.details.amount?.toLocaleString()} ₽: {step.details.title}
                          </h4>
                        )}
                        {step.type === 'TICKET' && (
                          <h4 className="text-xs font-bold text-slate-800 truncate">
                            Закрытие: {step.details.title}
                          </h4>
                        )}

                        <p className="text-[10px] text-slate-400 font-medium truncate max-w-[400px]">
                          {step.details.description || step.details.reason || step.details.content || 'Ожидает подписи'}
                        </p>
                      </div>
                    </div>

                    <span className="text-[9px] text-slate-400 font-semibold mt-1 shrink-0">
                      {new Date(step.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Details review drawer */}
      {selectedStepId && selectedStep && (
        <div className="w-[450px] premium-card p-5 h-full overflow-hidden flex flex-col shrink-0 shadow-lg border-l border-slate-200 animate-fade-in z-20">
          <div className="flex flex-col flex-1 overflow-hidden space-y-4 justify-between">
            {/* Header Details */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Панель рецензирования</span>
                <p className="text-xs font-bold text-slate-800">Согласование документа</p>
              </div>
              <button
                onClick={() => setSelectedStepId(null)}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable details and text */}
            <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-xs">
              <div className="space-y-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Детали запроса</span>
                
                {/* 1. Vacations card view */}
                {selectedStep.type === 'VACATION' && (
                  <div className="space-y-2 text-slate-700">
                    <p className="font-semibold">
                      Сотрудник:{' '}
                      <span className="text-slate-800 font-bold">
                        {selectedStep.details.employee.firstName} {selectedStep.details.employee.lastName}
                      </span>
                    </p>
                    <p className="font-semibold">
                      Начало: <span className="text-slate-800 font-bold">{new Date(selectedStep.details.startDate).toLocaleDateString()}</span>
                    </p>
                    <p className="font-semibold">
                      Окончание: <span className="text-slate-800 font-bold">{new Date(selectedStep.details.endDate).toLocaleDateString()}</span>
                    </p>
                    {selectedStep.details.reason && (
                      <div className="pt-2 border-t border-slate-200">
                        <span className="text-[9px] text-slate-400 block uppercase tracking-wider mb-0.5">Обоснование</span>
                        <p className="font-medium">{selectedStep.details.reason}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. HR Orders card view */}
                {selectedStep.type === 'HR_ORDER' && (
                  <div className="space-y-2 text-slate-700">
                    <p className="font-semibold">
                      Приказ: <span className="text-slate-800 font-bold">{selectedStep.details.title}</span>
                    </p>
                    <p className="font-semibold">
                      Тип: <span className="text-slate-800 font-bold">{selectedStep.details.type}</span>
                    </p>
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-[9px] text-slate-400 block uppercase tracking-wider mb-0.5">Формулировка</span>
                      <p className="font-medium whitespace-pre-line leading-relaxed">{selectedStep.details.content}</p>
                    </div>
                  </div>
                )}

                {/* 3. Finance claims card view */}
                {selectedStep.type === 'FINANCE' && (
                  <div className="space-y-2 text-slate-700">
                    <p className="font-semibold">
                      Запрос компенсации:{' '}
                      <span className="text-slate-800 font-bold">
                        {selectedStep.details.title}
                      </span>
                    </p>
                    <p className="font-semibold">
                      Сумма к выплате:{' '}
                      <span className="text-emerald-600 font-extrabold">{selectedStep.details.amount?.toLocaleString()} ₽</span>
                    </p>
                    <p className="font-semibold">
                      Категория: <span className="text-slate-800 font-bold">{selectedStep.details.category}</span>
                    </p>
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-[9px] text-slate-400 block uppercase tracking-wider mb-0.5">Обоснование</span>
                      <p className="font-medium">{selectedStep.details.description}</p>
                    </div>
                  </div>
                )}

                {/* 4. Ticket approvals card view */}
                {selectedStep.type === 'TICKET' && (
                  <div className="space-y-2 text-slate-700">
                    <p className="font-semibold">
                      Заявка: <span className="text-slate-800 font-bold">{selectedStep.details.title}</span>
                    </p>
                    <p className="font-semibold">
                      Приоритет: <span className="text-slate-800 font-bold">{selectedStep.details.priority}</span>
                    </p>
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-[9px] text-slate-400 block uppercase tracking-wider mb-0.5">Суть проблемы</span>
                      <p className="font-medium whitespace-pre-line leading-relaxed">{selectedStep.details.description}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Reviewer Comment textarea */}
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">Комментарий рецензента</label>
                <textarea
                  rows={4}
                  placeholder="Добавьте официальный вердикт или замечания..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl p-2.5 text-xs text-slate-800 outline-none transition-all resize-none"
                />
              </div>
            </div>

            {/* Action buttons footer */}
            <div className="pt-3 border-t border-slate-100 shrink-0 flex gap-3">
              <button
                onClick={() => handleAction('REJECT')}
                disabled={actionMutation.isPending}
                className="flex-1 py-2 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors text-xs disabled:opacity-50"
              >
                <span>Отклонить</span>
              </button>
              
              <button
                onClick={() => handleAction('APPROVE')}
                disabled={actionMutation.isPending}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors text-xs shadow-sm disabled:opacity-50"
              >
                <span>Согласовать</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
