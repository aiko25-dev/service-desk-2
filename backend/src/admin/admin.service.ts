import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // --- Audit Logs ---
  async getAuditLogs() {
    return this.prisma.auditLog.findMany({
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // --- Ticket Categories ---
  async getCategories() {
    return this.prisma.ticketCategory.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(name: string, adminId: string) {
    const cat = await this.prisma.ticketCategory.create({
      data: { name },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'CATEGORY_CREATED',
        details: `Создана новая категория заявок "${name}".`,
      },
    });

    return cat;
  }

  async deleteCategory(id: string, adminId: string) {
    const cat = await this.prisma.ticketCategory.findUnique({ where: { id } });
    if (!cat) {
      throw new NotFoundException('Категория не найдена');
    }

    await this.prisma.ticketCategory.delete({
      where: { id },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'CATEGORY_DELETED',
        details: `Удалена категория заявок "${cat.name}".`,
      },
    });

    return { success: true };
  }
}
