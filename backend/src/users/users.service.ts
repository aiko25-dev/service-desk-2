import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        position: true,
        isActive: true,
        joinDate: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRoster() {
    return this.prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        department: true,
        position: true,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        position: true,
        isActive: true,
        joinDate: true,
        avatar: true,
        createdAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    return user;
  }

  async create(data: any, adminId: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new BadRequestException('Пользователь с таким email уже существует');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password || 'Company123!', salt);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role || Role.OPERATOR,
        department: data.department,
        position: data.position,
        joinDate: data.joinDate ? new Date(data.joinDate) : new Date(),
        isActive: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'USER_CREATED_BY_ADMIN',
        details: `Администратор создал пользователя ${user.firstName} ${user.lastName} (${user.email}) с ролью ${user.role}.`,
      },
    });

    const { password, ...result } = user;
    return result;
  }

  async update(id: string, data: any, updaterId: string) {
    const user = await this.findOne(id);

    const updateData: any = {
      firstName: data.firstName,
      lastName: data.lastName,
      department: data.department,
      position: data.position,
    };

    if (data.avatar !== undefined) {
      updateData.avatar = data.avatar;
    }

    // Only Admin can update role & isActive
    const updater = await this.prisma.user.findUnique({ where: { id: updaterId } });
    if (updater?.role === Role.ADMIN) {
      if (data.role) updateData.role = data.role;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.joinDate) updateData.joinDate = new Date(data.joinDate);
      
      if (data.password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(data.password, salt);
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    await this.prisma.auditLog.create({
      data: {
        userId: updaterId,
        action: 'USER_UPDATED',
        details: `Обновлен пользователь ${user.firstName} ${user.lastName} (${user.email}). Изменения: ${JSON.stringify(Object.keys(updateData))}`,
      },
    });

    const { password, ...result } = updatedUser;
    return result;
  }

  async remove(id: string, adminId: string) {
    const user = await this.findOne(id);
    
    // Instead of deleting (which breaks relations), we block the user
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'USER_DEACTIVATED',
        details: `Пользователь ${user.firstName} ${user.lastName} (${user.email}) деактивирован администратором.`,
      },
    });

    return { success: true, message: 'Пользователь успешно деактивирован' };
  }
}
