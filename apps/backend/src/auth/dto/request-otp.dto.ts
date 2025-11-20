import { IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';

export class RequestOtpDto {
  @IsEmail({}, { message: 'Invalid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;
}
