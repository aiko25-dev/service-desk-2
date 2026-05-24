import { PrismaClient, Role, TicketStatus, Priority } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clean existing data (except if there is data, keep it simple by upserting or deleting)
  // To avoid relation constraints, we delete in correct order
  await prisma.auditLog.deleteMany({});
  await prisma.approvalStep.deleteMany({});
  await prisma.financeRequest.deleteMany({});
  await prisma.hrOrder.deleteMany({});
  await prisma.vacationRequest.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.file.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.ticketCategory.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Database cleaned.');

  // 2. Create Users
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('Admin123!', salt);
  const operatorPassword = await bcrypt.hash('Operator123!', salt);
  const managerPassword = await bcrypt.hash('Manager123!', salt);
  const hrPassword = await bcrypt.hash('Hr123!', salt);
  const accountantPassword = await bcrypt.hash('Accountant123!', salt);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@company.com',
      password: adminPassword,
      firstName: 'Алексей',
      lastName: 'Админов',
      role: Role.ADMIN,
      department: 'IT Департамент',
      position: 'Системный администратор',
    },
  });

  const operator = await prisma.user.create({
    data: {
      email: 'operator@company.com',
      password: operatorPassword,
      firstName: 'Иван',
      lastName: 'Операторов',
      role: Role.OPERATOR,
      department: 'Техподдержка',
      position: 'Ведущий оператор',
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@company.com',
      password: managerPassword,
      firstName: 'Дмитрий',
      lastName: 'Менеджеров',
      role: Role.MANAGER,
      department: 'Директорат',
      position: 'Генеральный директор',
    },
  });

  const hr = await prisma.user.create({
    data: {
      email: 'hr@company.com',
      password: hrPassword,
      firstName: 'Елена',
      lastName: 'Кадрова',
      role: Role.HR,
      department: 'HR отдел',
      position: 'Директор по персоналу',
    },
  });

  const accountant = await prisma.user.create({
    data: {
      email: 'accountant@company.com',
      password: accountantPassword,
      firstName: 'Мария',
      lastName: 'Счетовод',
      role: Role.ACCOUNTANT,
      department: 'Бухгалтерия',
      position: 'Главный бухгалтер',
    },
  });

  console.log('Users seeded:', {
    admin: admin.email,
    operator: operator.email,
    manager: manager.email,
    hr: hr.email,
    accountant: accountant.email,
  });

  // 3. Create Ticket Categories
  const categories = [
    'Техническая поддержка',
    'Программное обеспечение',
    'Закупки оборудования',
    'HR & Отпуска',
    'Хозяйственные нужды',
  ];

  for (const catName of categories) {
    await prisma.ticketCategory.create({
      data: { name: catName },
    });
  }
  console.log('Ticket categories seeded.');

  // 4. Create Sample Tickets
  const ticket1 = await prisma.ticket.create({
    data: {
      title: 'Не работает принтер на 3 этаже',
      description: 'Принтер выдает ошибку замятия бумаги, хотя бумаги внутри нет. Срочно нужен ремонт для бухгалтерии.',
      status: TicketStatus.NEW,
      priority: Priority.HIGH,
      category: 'Техническая поддержка',
      creatorId: accountant.id,
    },
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      title: 'Запрос на установку IntelliJ IDEA',
      description: 'Необходимо предоставить лицензию и установить IntelliJ IDEA Ultimate для разработки нового модуля.',
      status: TicketStatus.ACCEPTED,
      priority: Priority.MEDIUM,
      category: 'Программное обеспечение',
      creatorId: operator.id,
      assigneeId: admin.id,
    },
  });

  const ticket3 = await prisma.ticket.create({
    data: {
      title: 'Закупка новых кресел в офис',
      description: 'Необходимо закупить 5 эргономичных кресел в отдел маркетинга. Заявка согласована с директором.',
      status: TicketStatus.PENDING_APPROVAL,
      priority: Priority.LOW,
      category: 'Закупки оборудования',
      creatorId: hr.id,
      assigneeId: operator.id,
    },
  });

  console.log('Sample tickets seeded.');

  // 5. Create Comments
  await prisma.comment.create({
    data: {
      text: 'Вчера проводили чистку принтера, видимо, датчик замятия вышел из строя. Сейчас посмотрю.',
      ticketId: ticket1.id,
      authorId: admin.id,
    },
  });

  await prisma.comment.create({
    data: {
      text: 'Лицензия согласована. Ожидайте ключ активации в течение дня.',
      ticketId: ticket2.id,
      authorId: admin.id,
    },
  });

  console.log('Comments seeded.');

  // 6. Create Kanban Tasks
  await prisma.task.create({
    data: {
      title: 'Очистить датчик принтера',
      description: 'Проверить оптический датчик подачи бумаги в лотке 2',
      status: 'TODO',
      ticketId: ticket1.id,
      assigneeId: admin.id,
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
    },
  });

  await prisma.task.create({
    data: {
      title: 'Активировать ключ WebStorm/IntelliJ',
      description: 'Связаться с дистрибьютором софта',
      status: 'IN_PROGRESS',
      ticketId: ticket2.id,
      assigneeId: admin.id,
    },
  });

  console.log('Kanban tasks seeded.');

  // 7. Create Finance Requests
  await prisma.financeRequest.create({
    data: {
      title: 'Подписка на облачный сервер AWS',
      amount: 12500.0,
      category: 'SOFTWARE',
      description: 'Оплата хостинга для тестовой среды Service Desk на 3 месяца.',
      status: 'APPROVED',
      creatorId: admin.id,
    },
  });

  await prisma.financeRequest.create({
    data: {
      title: 'Покупка канцелярии для офиса',
      amount: 4500.0,
      category: 'OFFICE',
      description: 'Бумага А4, ручки, блокноты, маркеры для белой доски.',
      status: 'PENDING',
      creatorId: hr.id,
    },
  });

  console.log('Finance requests seeded.');

  // 8. Create Vacation Requests
  await prisma.vacationRequest.create({
    data: {
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // in 2 weeks
      endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 2 weeks duration
      status: 'PENDING',
      reason: 'Ежегодный оплачиваемый отпуск за 2026 год.',
      employeeId: operator.id,
    },
  });

  console.log('Vacation requests seeded.');

  // 9. Internal Messages
  await prisma.message.create({
    data: {
      subject: 'Добро пожаловать в систему!',
      body: 'Приветствуем вас в корпоративном Service Desk. Здесь вы можете управлять заявками, задачами и согласованиями.',
      senderId: admin.id,
      receiverId: operator.id,
      isRead: false,
    },
  });

  await prisma.message.create({
    data: {
      subject: 'Отчет по расходам за прошлый месяц',
      body: 'Мария, я загрузила все финансовые заявки в систему. Пожалуйста, проверьте и выгрузите Excel отчет.',
      senderId: hr.id,
      receiverId: accountant.id,
      isRead: false,
    },
  });

  console.log('Internal messages seeded.');

  // 10. Audit Logs
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'SYSTEM_INITIALIZATION',
      details: 'Система Service Desk успешно инициализирована и заполнена демо-данными.',
    },
  });

  console.log('Audit logs seeded.');
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
