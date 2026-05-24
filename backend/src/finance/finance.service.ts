import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as ExcelJS from 'exceljs';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.financeRequest.findMany({
      include: {
        creator: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, data: { title: string; amount: number; category: string; description: string }) {
    const claim = await this.prisma.financeRequest.create({
      data: {
        title: data.title,
        amount: Number(data.amount),
        category: data.category,
        description: data.description,
        status: 'PENDING',
        creatorId: userId,
      },
    });

    // Create Manager Approval Step
    const managers = await this.prisma.user.findMany({ where: { role: Role.MANAGER, isActive: true } });
    const primaryManagerId = managers[0]?.id || userId;

    await this.prisma.approvalStep.create({
      data: {
        type: 'FINANCE',
        referenceId: claim.id,
        approverId: primaryManagerId,
        status: 'PENDING',
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'FINANCE_CLAIM_SUBMITTED',
        details: `Пользователь подал финансовую заявку "${data.title}" на сумму ${data.amount} руб. в категории ${data.category}.`,
      },
    });

    return claim;
  }

  async getStats() {
    // Group expenses by category
    const approvedClaims = await this.prisma.financeRequest.findMany({
      where: { status: 'APPROVED' },
    });

    const categoryTotals: Record<string, number> = {};
    approvedClaims.forEach((claim) => {
      categoryTotals[claim.category] = (categoryTotals[claim.category] || 0) + claim.amount;
    });

    const chartData = Object.keys(categoryTotals).map((cat) => ({
      name: cat,
      value: categoryTotals[cat],
    }));

    const totalSpent = approvedClaims.reduce((sum, c) => sum + c.amount, 0);

    return {
      totalSpent,
      chartData,
    };
  }

  async exportToExcel() {
    const claims = await this.prisma.financeRequest.findMany({
      include: {
        creator: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Расходы');

    worksheet.columns = [
      { header: 'ID Заявки', key: 'id', width: 25 },
      { header: 'Название', key: 'title', width: 25 },
      { header: 'Сумма (руб.)', key: 'amount', width: 15 },
      { header: 'Категория', key: 'category', width: 20 },
      { header: 'Описание', key: 'description', width: 35 },
      { header: 'Статус', key: 'status', width: 15 },
      { header: 'Сотрудник', key: 'creator', width: 25 },
      { header: 'Дата подачи', key: 'createdAt', width: 20 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0D9488' }, // Teal secondary theme
    };

    claims.forEach((c) => {
      worksheet.addRow({
        id: c.id,
        title: c.title,
        amount: c.amount,
        category: c.category,
        description: c.description,
        status: c.status,
        creator: `${c.creator.firstName} ${c.creator.lastName}`,
        createdAt: c.createdAt.toLocaleDateString(),
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}
