import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, Req, Query, Delete, Param, Get } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('storage')
export class StorageController {
  constructor(private storageService: StorageService) {}

  @Get()
  async getFiles(@Query('ticketId') ticketId?: string) {
    return this.storageService.findAll(ticketId);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
    @Query('ticketId') ticketId?: string,
  ) {
    return this.storageService.saveFile(file, req.user.id, ticketId);
  }

  @Delete(':id')
  async deleteFile(@Param('id') id: string) {
    return this.storageService.deleteFile(id);
  }
}
