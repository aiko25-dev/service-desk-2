import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor(private prisma: PrismaService) {
    // Ensure the uploads directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(file: Express.Multer.File, uploaderId: string, ticketId?: string) {
    if (!file) {
      throw new BadRequestException('Файл не предоставлен');
    }

    // 50MB limit validation
    const maxSizeBytes = 50 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new BadRequestException('Размер файла превышает допустимый лимит 50МБ');
    }

    // Generate unique name
    const timestamp = Date.now();
    const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueName = `${timestamp}_${cleanFileName}`;
    const filePath = path.join(this.uploadDir, uniqueName);

    // Save physical file
    fs.writeFileSync(filePath, file.buffer);

    // Save metadata in database
    // We return host-agnostic relative URLs (e.g., /uploads/timestamp_file.png)
    const fileUrl = `/uploads/${uniqueName}`;

    const dbFile = await this.prisma.file.create({
      data: {
        name: file.originalname,
        url: fileUrl,
        size: file.size,
        mimeType: file.mimetype,
        uploaderId,
        ticketId: ticketId || null,
      },
    });

    return dbFile;
  }

  async deleteFile(id: string) {
    const fileRecord = await this.prisma.file.findUnique({
      where: { id },
    });

    if (!fileRecord) {
      throw new BadRequestException('Файл не найден в базе данных');
    }

    const fileName = path.basename(fileRecord.url);
    const filePath = path.join(this.uploadDir, fileName);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await this.prisma.file.delete({
      where: { id },
    });

    return { success: true };
  }
}
