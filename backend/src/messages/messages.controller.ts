import { Controller, Get, Post, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Get('inbox')
  async getInbox(@Req() req) {
    return this.messagesService.getInbox(req.user.id);
  }

  @Get('sent')
  async getSent(@Req() req) {
    return this.messagesService.getSent(req.user.id);
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req) {
    return this.messagesService.getUnreadCount(req.user.id);
  }

  @Post()
  async create(@Req() req, @Body() data: any) {
    return this.messagesService.create(req.user.id, data);
  }

  @Put(':id/read')
  async read(@Req() req, @Param('id') id: string) {
    return this.messagesService.markAsRead(id, req.user.id);
  }
}
