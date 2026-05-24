import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TicketStatus, Priority, Role } from '@prisma/client';
import * as ExcelJS from 'exceljs';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: {
    status?: TicketStatus;
    priority?: Priority;
    category?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    return this.prisma.ticket.findMany({
      where,
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        assignee: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        _count: {
          select: { comments: true, files: true, tasks: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true, department: true, position: true },
        },
        assignee: {
          select: { id: true, firstName: true, lastName: true, email: true, department: true, position: true },
        },
        comments: {
          include: {
            author: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        files: true,
        tasks: {
          include: {
            assignee: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Заявка не найдена');
    }

    return ticket;
  }

  async create(data: { title: string; description: string; category: string; priority: Priority; fileIds?: string[] }, creatorId: string) {
    const ticket = await this.prisma.ticket.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        creatorId,
      },
    });

    // Attach pre-uploaded files if any
    if (data.fileIds && data.fileIds.length > 0) {
      await this.prisma.file.updateMany({
        where: { id: { in: data.fileIds } },
        data: { ticketId: ticket.id },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        userId: creatorId,
        action: 'TICKET_CREATED',
        details: `Создана заявка #${ticket.id}: "${ticket.title}" в категории "${ticket.category}".`,
      },
    });

    return this.findOne(ticket.id);
  }

  async updateStatus(id: string, status: TicketStatus, userId: string, commentText?: string) {
    const ticket = await this.findOne(id);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) throw new ForbiddenException('Пользователь не найден');

    // Simple role-based transition guard
    // Operators/Admin can change status anytime, managers approve PENDING_APPROVAL
    if (user.role !== Role.OPERATOR && user.role !== Role.ADMIN && user.role !== Role.MANAGER && ticket.creatorId !== userId) {
      throw new ForbiddenException('У вас нет прав для изменения статуса этой заявки');
    }

    const oldStatus = ticket.status;
    const updatedTicket = await this.prisma.ticket.update({
      where: { id },
      data: { status },
    });

    // Create system comment explaining the state transition
    await this.prisma.comment.create({
      data: {
        text: `[Система]: Статус заявки изменен с "${oldStatus}" на "${status}".${commentText ? ` Комментарий: ${commentText}` : ''}`,
        ticketId: id,
        authorId: userId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'TICKET_STATUS_CHANGED',
        details: `Статус заявки #${ticket.id} изменен с ${oldStatus} на ${status} пользователем ${user.firstName} ${user.lastName}.`,
      },
    });

    return this.findOne(id);
  }

  async acceptTicket(id: string, operatorId: string) {
    const ticket = await this.findOne(id);
    const operator = await this.prisma.user.findUnique({ where: { id: operatorId } });

    if (!operator || (operator.role !== Role.OPERATOR && operator.role !== Role.ADMIN)) {
      throw new ForbiddenException('Только оператор или администратор может принять заявку');
    }

    const updated = await this.prisma.ticket.update({
      where: { id },
      data: {
        status: TicketStatus.ACCEPTED,
        assigneeId: operatorId,
      },
    });

    await this.prisma.comment.create({
      data: {
        text: `[Система]: Оператор ${operator.firstName} ${operator.lastName} принял заявку в работу.`,
        ticketId: id,
        authorId: operatorId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: operatorId,
        action: 'TICKET_ACCEPTED',
        details: `Оператор ${operator.firstName} ${operator.lastName} принял заявку #${ticket.id}.`,
      },
    });

    return this.findOne(id);
  }

  async addComment(id: string, text: string, authorId: string) {
    const ticket = await this.findOne(id);

    const comment = await this.prisma.comment.create({
      data: {
        text,
        ticketId: id,
        authorId,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
      },
    });

    return comment;
  }

  async exportToExcel(filters: any) {
    const tickets = await this.findAll(filters);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Заявки');

    worksheet.columns = [
      { header: 'ID Заявки', key: 'id', width: 25 },
      { header: 'Тема', key: 'title', width: 30 },
      { header: 'Описание', key: 'description', width: 40 },
      { header: 'Статус', key: 'status', width: 20 },
      { header: 'Приоритет', key: 'priority', width: 15 },
      { header: 'Категория', key: 'category', width: 25 },
      { header: 'Создатель', key: 'creator', width: 25 },
      { header: 'Исполнитель', key: 'assignee', width: 25 },
      { header: 'Дата создания', key: 'createdAt', width: 20 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E40AF' }, // Blue primary theme
    };

    tickets.forEach((t) => {
      worksheet.addRow({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        category: t.category,
        creator: `${t.creator.firstName} ${t.creator.lastName} (${t.creator.email})`,
        assignee: t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}` : 'Не назначен',
        createdAt: t.createdAt.toLocaleDateString(),
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  async getKpis() {
    const total = await this.prisma.ticket.count();
    const open = await this.prisma.ticket.count({
      where: { status: { in: [TicketStatus.NEW, TicketStatus.ACCEPTED, TicketStatus.IN_PROGRESS] } },
    });
    const closed = await this.prisma.ticket.count({
      where: { status: TicketStatus.CLOSED },
    });
    const inProgress = await this.prisma.ticket.count({
      where: { status: TicketStatus.IN_PROGRESS },
    });

    const recent = await this.prisma.ticket.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { firstName: true, lastName: true } },
      },
    });

    const statusGroups = await this.prisma.ticket.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    const statusChart = statusGroups.map((g) => ({
      name: g.status,
      value: g._count.id,
    }));

    return {
      total,
      open,
      closed,
      inProgress,
      recent,
      statusChart,
    };
  }
}
