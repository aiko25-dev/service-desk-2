import { Controller, Get, Post, Body, UseGuards, Req, Res } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('finance')
export class FinanceController {
  constructor(private financeService: FinanceService) {}

  @Get()
  async getAll() {
    return this.financeService.findAll();
  }

  @Post()
  async create(@Req() req, @Body() data: any) {
    return this.financeService.create(req.user.id, data);
  }

  @Get('stats')
  async getStats() {
    return this.financeService.getStats();
  }

  @Get('export')
  async export(@Res() res: any) {
    const buffer = await this.financeService.exportToExcel();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=expenses_export.xlsx');
    res.send(buffer);
  }
}
