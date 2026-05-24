import { Controller, Get, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('approvals')
export class ApprovalsController {
  constructor(private approvalsService: ApprovalsService) {}

  @Roles(Role.MANAGER, Role.ADMIN)
  @Get('pending')
  async getPending(@Req() req) {
    return this.approvalsService.getPendingApprovals(req.user.id);
  }

  @Roles(Role.MANAGER, Role.ADMIN)
  @Put(':id')
  async action(
    @Param('id') id: string,
    @Body('action') action: 'APPROVE' | 'REJECT',
    @Body('comment') comment: string,
    @Req() req,
  ) {
    return this.approvalsService.actionApproval(id, action, comment, req.user.id);
  }
}
