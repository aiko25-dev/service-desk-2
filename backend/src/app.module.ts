import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StorageModule } from './storage/storage.module';
import { TicketsModule } from './tickets/tickets.module';
import { TasksModule } from './tasks/tasks.module';
import { MessagesModule } from './messages/messages.module';
import { HrModule } from './hr/hr.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { FinanceModule } from './finance/finance.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    StorageModule,
    TicketsModule,
    TasksModule,
    MessagesModule,
    HrModule,
    ApprovalsModule,
    FinanceModule,
    AdminModule,
  ],
})
export class AppModule {}
