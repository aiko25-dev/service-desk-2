import { IsEmail, IsString, IsNotEmpty, MinLength, IsOptional, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
  @IsEmail({}, { message: 'Неверный формат email' })
  @IsNotEmpty({ message: 'Email обязателен к заполнению' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Пароль обязателен к заполнению' })
  @MinLength(6, { message: 'Пароль должен состоять минимум из 6 символов' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Имя обязательно к заполнению' })
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'Фамилия обязательна к заполнению' })
  lastName: string;

  @IsEnum(Role, { message: 'Недопустимая роль пользователя' })
  @IsOptional()
  role?: Role;

  @IsString()
  @IsOptional()
  department?: string;

  @IsString()
  @IsOptional()
  position?: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'Неверный формат email' })
  @IsNotEmpty({ message: 'Email обязателен к заполнению' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Пароль обязателен к заполнению' })
  password: string;
}
