import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Roles(Role.ADMIN, Role.HR, Role.MANAGER)
  @Get()
  async getAll() {
    return this.usersService.findAll();
  }

  @Get('roster')
  async getRoster() {
    return this.usersService.getRoster();
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Roles(Role.ADMIN)
  @Post()
  async create(@Body() data: any, @Req() req) {
    return this.usersService.create(data, req.user.id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any, @Req() req) {
    // A user can only update their own profile, unless they are an ADMIN
    if (req.user.role !== Role.ADMIN && req.user.id !== id) {
      throw new ForbiddenException('Вы не можете редактировать чужой профиль');
    }
    return this.usersService.update(id, data, req.user.id);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    return this.usersService.remove(id, req.user.id);
  }
}
