import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Roles(Role.ADMIN)
  @Get('logs')
  async getLogs() {
    return this.adminService.getAuditLogs();
  }

  // Anyone authenticated can read categories for dropdowns
  @Get('categories')
  async getCategories() {
    return this.adminService.getCategories();
  }

  @Roles(Role.ADMIN)
  @Post('categories')
  async createCategory(@Body('name') name: string, @Req() req) {
    return this.adminService.createCategory(name, req.user.id);
  }

  @Roles(Role.ADMIN)
  @Delete('categories/:id')
  async deleteCategory(@Param('id') id: string, @Req() req) {
    return this.adminService.deleteCategory(id, req.user.id);
  }
}
