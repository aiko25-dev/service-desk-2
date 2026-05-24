import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class HrService {
  constructor(private prisma: PrismaService) {}

  // --- Vacation Requests ---
  async getVacations(userId: string, role: Role) {
    // HR and MANAGER see all vacation requests, employees see only theirs
    if (role === Role.HR || role === Role.MANAGER || role === Role.ADMIN) {
      return this.prisma.vacationRequest.findMany({
        include: {
          employee: { select: { id: true, firstName: true, lastName: true, email: true, department: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }
    return this.prisma.vacationRequest.findMany({
      where: { employeeId: userId },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, email: true, department: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createVacation(userId: string, data: { startDate: string; endDate: string; reason?: string }) {
    const request = await this.prisma.vacationRequest.create({
      data: {
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        reason: data.reason || null,
        employeeId: userId,
        status: 'PENDING',
      },
    });

    // Create a centralized ApprovalStep for the Manager
    const managers = await this.prisma.user.findMany({ where: { role: Role.MANAGER, isActive: true } });
    const primaryManagerId = managers[0]?.id || userId; // fallback to self if no manager

    await this.prisma.approvalStep.create({
      data: {
        type: 'VACATION',
        referenceId: request.id,
        approverId: primaryManagerId,
        status: 'PENDING',
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'VACATION_REQUESTED',
        details: `Пользователь подал заявку на отпуск с ${data.startDate} по ${data.endDate}.`,
      },
    });

    return request;
  }

  // --- HR Orders ---
  async getOrders(role: Role) {
    if (role !== Role.HR && role !== Role.MANAGER && role !== Role.ADMIN) {
      throw new ForbiddenException('Доступ к приказам разрешен только HR, Менеджерам и Администраторам');
    }
    return this.prisma.hrOrder.findMany({
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, email: true, department: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createOrder(creatorId: string, data: { title: string; type: string; content: string; employeeId?: string }) {
    const order = await this.prisma.hrOrder.create({
      data: {
        title: data.title,
        type: data.type, // "HIRE", "TERMINATION", "TRANSFER"
        content: data.content,
        employeeId: data.employeeId || null,
        status: 'PENDING',
      },
    });

    // Trigger Manager Approval
    const managers = await this.prisma.user.findMany({ where: { role: Role.MANAGER, isActive: true } });
    const primaryManagerId = managers[0]?.id || creatorId;

    await this.prisma.approvalStep.create({
      data: {
        type: 'HR_ORDER',
        referenceId: order.id,
        approverId: primaryManagerId,
        status: 'PENDING',
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: creatorId,
        action: 'HR_ORDER_CREATED',
        details: `Создан приказ "${data.title}" типа ${data.type} для согласования с менеджером.`,
      },
    });

    return order;
  }
}
