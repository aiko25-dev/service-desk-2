import { PrismaClient, Role, TicketStatus, Priority } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clean existing data in correct order
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

  // 2. Create Users (with names matching the screenshots)
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
      firstName: 'Мөлдір',
      lastName: 'Мурат',
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
      firstName: 'Бибигул',
      lastName: 'Айбуллаева',
      role: Role.HR,
      department: 'HR отдел',
      position: 'Директор по персоналу',
    },
  });

  const accountant = await prisma.user.create({
    data: {
      email: 'accountant@company.com',
      password: accountantPassword,
      firstName: 'Айнур',
      lastName: 'Бексеитова',
      role: Role.ACCOUNTANT,
      department: 'Бухгалтерия',
      position: 'Главный бухгалтер',
    },
  });

  console.log('Users seeded:', {
    admin: admin.email,
    operator: `${operator.lastName} ${operator.firstName}`,
    manager: manager.email,
    hr: `${hr.lastName} ${hr.firstName}`,
    accountant: `${accountant.lastName} ${accountant.firstName}`,
  });

  // 3. Create Ticket Categories (matching the tabs in the screenshots)
  const categories = [
    'по НБД',
    'по ОС',
    'АСМ',
    'ГУК',
    'ГКО',
    'РВПЗ',
    'ПЭК',
  ];

  for (const catName of categories) {
    await prisma.ticketCategory.create({
      data: { name: catName },
    });
  }
  console.log('Ticket categories seeded.');

  // 4. Create Sample Tickets matching screenshots exactly

  // -- ПО НБД TICKETS --
  await prisma.ticket.create({
    data: {
      title: 'Не работает портал',
      description: 'При попытке входа на портал система выдает неизвестную ошибку.',
      status: TicketStatus.IN_PROGRESS,
      priority: Priority.MEDIUM,
      category: 'по НБД',
      company: 'ТОО "СП СИНЕ МИДАС СТРОЙ"',
      phone: '87089562548',
      email: 'info@sinemidas.kz',
      section: 'сайт НБД',
      resolution: 'Со стороны АО «НИТ» выполнены необходимые работы по устранению выявленной проблемы.',
      creatorId: admin.id,
      assigneeId: operator.id,
      createdAt: new Date('2026-06-22T10:00:00Z'),
    },
  });

  await prisma.ticket.create({
    data: {
      title: 'Регистрация нового директора',
      description: 'В связи с увольнением прежнего директора необходимо пройти процедуру регистрации нового директора.',
      status: TicketStatus.CLOSED,
      priority: Priority.LOW,
      category: 'по НБД',
      company: 'Коблан Турлыбаев',
      phone: '87014523698',
      email: 'koblan@mail.ru',
      section: 'сайт НБД',
      resolution: 'Разъяснено, необходимо пройти регистрацию с использованием новой ЭЦП юридического лица.',
      creatorId: admin.id,
      assigneeId: operator.id,
      createdAt: new Date('2026-06-23T11:00:00Z'),
    },
  });

  await prisma.ticket.create({
    data: {
      title: 'Ошибка входа',
      description: 'При попытке входа на портал возникает неизвестная ошибка.',
      status: TicketStatus.CLOSED,
      priority: Priority.LOW,
      category: 'по НБД',
      company: 'ГУ "Департамент экологии по Акмолинской области"',
      phone: '87771485623',
      email: 'akm_ecodep@gov.kz',
      section: 'сайт НБД',
      resolution: 'Со стороны АО «НИТ» выполнены необходимые работы по устранению выявленной проблемы.',
      creatorId: admin.id,
      assigneeId: operator.id,
      createdAt: new Date('2026-06-23T12:00:00Z'),
    },
  });

  // -- ПО ОС TICKETS --
  await prisma.ticket.create({
    data: {
      title: 'Ссылка на зум',
      description: 'Ссылка на зум неправильный, код доступа и идентификатор правильный',
      status: TicketStatus.IN_PROGRESS,
      priority: Priority.MEDIUM,
      category: 'по ОС',
      company: 'ТОО Компания Тамшалы',
      phone: '87013678071',
      email: 'tamshaly@mail.ru',
      section: 'Открытые собрания',
      resolution: '',
      creatorId: admin.id,
      assigneeId: hr.id,
      createdAt: new Date('2026-06-24T09:00:00Z'),
    },
  });

  await prisma.ticket.create({
    data: {
      title: 'Объявления на каз языке',
      description: 'во всех объявлениях указано на каз языке 2025',
      status: TicketStatus.IN_PROGRESS,
      priority: Priority.MEDIUM,
      category: 'по ОС',
      company: 'Коммунальное государственное учреждение "Аппарат акима Кененского сельского округа Кордайского района Жамбылской области"',
      phone: '87089181177',
      email: 'kenen_akimat@gov.kz',
      section: 'Открытые собрания',
      resolution: '',
      creatorId: admin.id,
      assigneeId: hr.id,
      createdAt: new Date('2026-06-24T10:00:00Z'),
    },
  });

  await prisma.ticket.create({
    data: {
      title: 'Вопрос по ОС',
      description: '',
      status: TicketStatus.IN_PROGRESS,
      priority: Priority.LOW,
      category: 'по ОС',
      company: 'ТОО «Демеу Кок-Тас», Павлодарская область',
      phone: '',
      email: 'demey@koktas.kz',
      section: 'Открытые собрания',
      resolution: '',
      creatorId: admin.id,
      assigneeId: hr.id,
      createdAt: new Date('2026-06-24T11:00:00Z'),
    },
  });

  await prisma.ticket.create({
    data: {
      title: 'Вопрос по ОС',
      description: '',
      status: TicketStatus.ACCEPTED,
      priority: Priority.LOW,
      category: 'по ОС',
      company: 'Товарищество с ограниченной ответственностью "Балхашметаллы", область Абай',
      phone: '',
      email: 'balkhash@metal.kz',
      section: 'Открытые собрания',
      resolution: '',
      creatorId: admin.id,
      assigneeId: hr.id,
      createdAt: new Date('2026-06-24T12:00:00Z'),
    },
  });

  // -- АСМ TICKETS --
  await prisma.ticket.create({
    data: {
      title: 'Не отображаются данные',
      description: 'Данные поступают в Smart Bridge, однако со стороны Министерства сообщается, что они не отображаются в системе. Имя пользователя: 89110335045, ФИО: Исабеков Азат Нурланович',
      status: TicketStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      category: 'АСМ',
      company: 'ТОО «GAS PROCESSING COMPANY»',
      phone: '87768561245',
      email: 'gpc@gpc.kz',
      section: 'АСМ',
      resolution: 'В работе АО «НИТ»',
      creatorId: admin.id,
      assigneeId: operator.id,
      createdAt: new Date('2026-06-18T10:00:00Z'),
    },
  });

  await prisma.ticket.create({
    data: {
      title: 'Доступ АСМ',
      description: 'Необходим доступ для просмотра данных АСМ.',
      status: TicketStatus.IN_PROGRESS,
      priority: Priority.MEDIUM,
      category: 'АСМ',
      company: 'ТОО «Павлодарский нефтехимический завод»',
      phone: '',
      email: 'n.doskenov@pnhz.kz',
      section: 'АСМ',
      resolution: 'Ожидаем получения доступа от Нурбакыт.',
      creatorId: admin.id,
      assigneeId: operator.id,
      createdAt: new Date('2026-06-19T11:00:00Z'),
    },
  });

  await prisma.ticket.create({
    data: {
      title: 'Не отображаются данные по ЖГОК',
      description: 'По информации Департамента экологии области Улытау, данные по ЖГОК не отображаются в системе АСМ через портал НБД имеется, однако предприятие отсутствует в результатах поиска (поле поиска не отображает данные). Имя пользователя: 910919350736, ФИО: Галиев Жанат Куандыкович',
      status: TicketStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      category: 'АСМ',
      company: 'АО "Жайремский горно-обогатительный комбинат"',
      phone: '87478453698',
      email: 'jgok@jgok.kz',
      section: 'АСМ',
      resolution: 'В работе АО «НИТ»',
      creatorId: admin.id,
      assigneeId: operator.id,
      createdAt: new Date('2026-06-19T12:00:00Z'),
    },
  });

  // -- ГКО TICKETS --
  await prisma.ticket.create({
    data: {
      title: 'Сроки открытия доступа',
      description: 'Требуется уточнение сроков открытия доступа к отчету в системе.',
      status: TicketStatus.CLOSED,
      priority: Priority.MEDIUM,
      category: 'ГКО',
      company: 'ТОО "ДОСАНАТ"',
      phone: '87024451256',
      email: 'dosanat@mail.ru',
      section: 'ГКО',
      resolution: 'Разъяснено, срок представления отчёта установлен до 1 марта каждого года.',
      creatorId: admin.id,
      assigneeId: operator.id,
      createdAt: new Date('2026-06-18T10:00:00Z'),
    },
  });

  await prisma.ticket.create({
    data: {
      title: 'Зайти на компонент ГКО',
      description: 'не получается зайти на компонент гко',
      status: TicketStatus.IN_PROGRESS,
      priority: Priority.MEDIUM,
      category: 'ГКО',
      company: 'ГУ "Департамент экологии по Акмолинской области"',
      phone: '87777785412',
      email: 'akm_ecodep@gov.kz',
      section: 'ГКО',
      resolution: 'в работе АО НИТ',
      creatorId: admin.id,
      assigneeId: operator.id,
      createdAt: new Date('2026-06-23T11:00:00Z'),
    },
  });

  await prisma.ticket.create({
    data: {
      title: 'Паспорта отходов',
      description: 'не получается загрузить паспорта отходов',
      status: TicketStatus.IN_PROGRESS,
      priority: Priority.MEDIUM,
      category: 'ГКО',
      company: 'проектная о РУк джулай Ruk Djulai',
      phone: '87274899663',
      email: 'ruk_djulai@mail.ru',
      section: 'ГКО',
      resolution: 'в работе АО НИТ',
      creatorId: admin.id,
      assigneeId: accountant.id,
      createdAt: new Date('2026-06-23T12:00:00Z'),
    },
  });

  await prisma.ticket.create({
    data: {
      title: 'Паспорта отходов',
      description: 'не получается загрузить паспорта отходов',
      status: TicketStatus.IN_PROGRESS,
      priority: Priority.MEDIUM,
      category: 'ГКО',
      company: 'проектная о РУк джулай Ruk Djulai',
      phone: '87274485123',
      email: 'ruk_djulai@mail.ru',
      section: 'ГКО',
      resolution: 'в работе АО НИТ',
      creatorId: admin.id,
      assigneeId: hr.id,
      createdAt: new Date('2026-06-24T12:00:00Z'),
    },
  });

  // -- ГУК TICKETS --
  await prisma.ticket.create({
    data: {
      title: 'Ошибки ОКЭД',
      description: 'Прошу внести изменения на портале НБДСОС и ПР по следующему вопросу. Организация: ТОО «КУЛ-БАС»\n\nБИН: 011040001557\n\nВ личном кабинете при регистрации были внесены данные, в том числе по юридическому адресу и код ОКЭД. На сегодняшний день нами сформирован отчет за 2025 год по выбросам парниковых газов. Указанный отчет направлен верификатору для проведения процедуры верификации с последующим направлением в уполномоченный орган. Однако в процессе проверки выявлено, что в сформированном электронном отчете некорректно отображается код ОКЭД - 06.10.',
      status: TicketStatus.IN_PROGRESS,
      priority: Priority.MEDIUM,
      category: 'ГУК',
      company: 'ТОО «КУЛ-БАС»',
      phone: '87172123456',
      email: 'kulbas@mail.ru',
      section: 'ГУК',
      resolution: '',
      creatorId: admin.id,
      assigneeId: operator.id,
      createdAt: new Date('2026-06-25T10:00:00Z'),
    },
  });

  console.log('Sample tickets seeded.');

  // 5. Create Kanban Tasks
  await prisma.task.create({
    data: {
      title: 'Очистить датчик принтера',
      description: 'Проверить оптический датчик подачи бумаги в лотке 2',
      status: 'TODO',
      assigneeId: admin.id,
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  await prisma.task.create({
    data: {
      title: 'Активировать ключ WebStorm/IntelliJ',
      description: 'Связаться с дистрибьютором софта',
      status: 'IN_PROGRESS',
      assigneeId: admin.id,
    },
  });

  console.log('Kanban tasks seeded.');

  // 6. Audit Logs
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
