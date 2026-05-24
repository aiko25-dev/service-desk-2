import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class ApprovalsService {
  constructor(private prisma: PrismaService) {}

  async getPendingApprovals(managerId: string) {
    // 1. Fetch structured approval steps (Vacations, HR Orders, Finance)
    const steps = await this.prisma.approvalStep.findMany({
      where: {
        approverId: managerId,
        status: 'PENDING',
      },
      orderBy: { createdAt: 'desc' },
    });

    const enrichedSteps: any[] = [];

    for (const step of steps) {
      let details: any = null;

      if (step.type === 'VACATION') {
        details = await this.prisma.vacationRequest.findUnique({
          where: { id: step.referenceId },
          include: { employee: { select: { firstName: true, lastName: true, email: true } } },
        });
      } else if (step.type === 'HR_ORDER') {
        details = await this.prisma.hrOrder.findUnique({
          where: { id: step.referenceId },
          include: { employee: { select: { firstName: true, lastName: true, email: true } } },
        });
      } else if (step.type === 'FINANCE') {
        details = await this.prisma.financeRequest.findUnique({
          where: { id: step.referenceId },
          include: { creator: { select: { firstName: true, lastName: true, email: true } } },
        });
      }

      if (details) {
        enrichedSteps.push({
          ...step,
          details,
        });
      }
    }

    // 2. Fetch pending tickets awaiting manager approval
    const pendingTickets = await this.prisma.ticket.findMany({
      where: { status: 'PENDING_APPROVAL' },
      include: {
        creator: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const ticketSteps = pendingTickets.map((t) => ({
      id: `ticket_${t.id}`,
      type: 'TICKET',
      referenceId: t.id,
      step: 1,
      status: 'PENDING',
      approverId: managerId,
      comment: null,
      createdAt: t.updatedAt,
      updatedAt: t.updatedAt,
      details: {
        id: t.id,
        title: t.title,
        description: t.description,
        category: t.category,
        priority: t.priority,
        creator: t.creator,
      },
    }));

    return [...enrichedSteps, ...ticketSteps];
  }

  async actionApproval(
    stepId: string,
    action: 'APPROVE' | 'REJECT',
    comment: string,
    managerId: string,
  ) {
    const manager = await this.prisma.user.findUnique({ where: { id: managerId } });
    if (!manager || (manager.role !== Role.MANAGER && manager.role !== Role.ADMIN)) {
      throw new ForbiddenException('Только менеджер или администратор может согласовать заявку');
    }

    const isTicket = stepId.startsWith('ticket_');
    const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    if (isTicket) {
      const ticketId = stepId.replace('ticket_', '');
      const targetStatus = action === 'APPROVE' ? 'CLOSED' : 'REJECTED';
      
      const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
      if (!ticket) throw new NotFoundException('Заявка не найдена');

      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: { status: targetStatus },
      });

      await this.prisma.comment.create({
        data: {
          text: `[Согласование]: Менеджер ${manager.firstName} ${manager.lastName} ${action === 'APPROVE' ? 'согласовал (закрыл)' : 'отклонил'} заявку. Комментарий: ${comment}`,
          ticketId,
          authorId: managerId,
        },
      });

      await this.prisma.auditLog.create({
        data: {
          userId: managerId,
          action: `TICKET_${action}`,
          details: `Менеджер ${action === 'APPROVE' ? 'согласовал' : 'отклонил'} заявку #${ticketId}.`,
        },
      });

      return { success: true };
    }

    // Process HR_ORDER, VACATION, or FINANCE ApprovalStep
    const step = await this.prisma.approvalStep.findUnique({ where: { id: stepId } });
    if (!step) {
      throw new NotFoundException('Этап согласования не найден');
    }

    if (step.approverId !== managerId && manager.role !== Role.ADMIN) {
      throw new ForbiddenException('Вы не являетесь назначенным согласующим лицом');
    }

    // Update approval step
    await this.prisma.approvalStep.update({
      where: { id: stepId },
      data: {
        status,
        comment,
      },
    });

    // Update underlying entity status
    if (step.type === 'VACATION') {
      await this.prisma.vacationRequest.update({
        where: { id: step.referenceId },
        data: { status },
      });
    } else if (step.type === 'HR_ORDER') {
      await this.prisma.hrOrder.update({
        where: { id: step.referenceId },
        data: { status },
      });
    } else if (step.type === 'FINANCE') {
      await this.prisma.financeRequest.update({
        where: { id: step.referenceId },
        data: { status },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        userId: managerId,
        action: `${step.type}_${action}`,
        details: `Менеджер ${action === 'APPROVE' ? 'согласовал' : 'отклонил'} запрос ${step.type} #${step.referenceId}.`,
      },
    });

    return { success: true };
  }
}
