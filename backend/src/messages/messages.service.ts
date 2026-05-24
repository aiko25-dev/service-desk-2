import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async getInbox(userId: string) {
    return this.prisma.message.findMany({
      where: { receiverId: userId },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSent(userId: string) {
    return this.prisma.message.findMany({
      where: { senderId: userId },
      include: {
        receiver: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.message.count({
      where: { receiverId: userId, isRead: false },
    });
    return { count };
  }

  async create(userId: string, data: { receiverId: string; subject: string; body: string }) {
    const msg = await this.prisma.message.create({
      data: {
        subject: data.subject,
        body: data.body,
        senderId: userId,
        receiverId: data.receiverId,
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, role: true } },
        receiver: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });

    return msg;
  }

  async markAsRead(id: string, userId: string) {
    const msg = await this.prisma.message.findUnique({ where: { id } });
    
    if (!msg) {
      throw new NotFoundException('Сообщение не найдено');
    }

    if (msg.receiverId !== userId) {
      throw new ForbiddenException('Вы не являетесь получателем этого сообщения');
    }

    const updated = await this.prisma.message.update({
      where: { id },
      data: { isRead: true },
    });

    return updated;
  }
}
