import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req, Res } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TicketStatus, Priority } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private ticketsService: TicketsService) {}

  @Get()
  async getAll(
    @Query('status') status?: TicketStatus,
    @Query('priority') priority?: Priority,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.ticketsService.findAll({ status, priority, category, search, startDate, endDate });
  }

  @Get('kpi')
  async getKpis() {
    return this.ticketsService.getKpis();
  }

  @Get('export')
  async export(
    @Res() res: any,
    @Query('status') status?: TicketStatus,
    @Query('priority') priority?: Priority,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const buffer = await this.ticketsService.exportToExcel({ status, priority, category, search, startDate, endDate });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=tickets_export.xlsx');
    res.send(buffer);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Post()
  async create(@Body() data: any, @Req() req) {
    return this.ticketsService.create(data, req.user.id);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: TicketStatus,
    @Body('comment') comment: string | undefined,
    @Req() req: any,
  ) {
    return this.ticketsService.updateStatus(id, status, req.user.id, comment);
  }

  @Put(':id/accept')
  async acceptTicket(@Param('id') id: string, @Req() req) {
    return this.ticketsService.acceptTicket(id, req.user.id);
  }

  @Post(':id/comments')
  async addComment(@Param('id') id: string, @Body('text') text: string, @Req() req) {
    return this.ticketsService.addComment(id, text, req.user.id);
  }
}
