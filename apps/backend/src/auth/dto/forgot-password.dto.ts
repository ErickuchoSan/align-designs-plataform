import { IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Invalid email' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;
}
