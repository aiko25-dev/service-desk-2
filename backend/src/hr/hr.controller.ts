import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { HrService } from './hr.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hr')
export class HrController {
  constructor(private hrService: HrService) {}

  @Get('vacations')
  async getVacations(@Req() req) {
    return this.hrService.getVacations(req.user.id, req.user.role);
  }

  @Post('vacations')
  async createVacation(@Req() req, @Body() data: any) {
    return this.hrService.createVacation(req.user.id, data);
  }

  @Roles(Role.HR, Role.MANAGER, Role.ADMIN)
  @Get('orders')
  async getOrders(@Req() req) {
    return this.hrService.getOrders(req.user.role);
  }

  @Roles(Role.HR, Role.ADMIN)
  @Post('orders')
  async createOrder(@Req() req, @Body() data: any) {
    return this.hrService.createOrder(req.user.id, data);
  }
}
