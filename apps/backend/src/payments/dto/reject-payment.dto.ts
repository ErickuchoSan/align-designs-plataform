import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RejectPaymentDto {
  @ApiProperty({
    description: 'Reason for rejecting the payment',
    example:
      'The receipt image is not clear. Please upload a higher quality image.',
    minLength: 10,
    maxLength: 500,
  })
  @IsString({ message: 'Rejection reason must be a string' })
  @IsNotEmpty({ message: 'Rejection reason is required' })
  @MinLength(10, { message: 'Rejection reason must be at least 10 characters' })
  @MaxLength(500, {
    message: 'Rejection reason must not exceed 500 characters',
  })
  @Transform(({ value }) => value?.trim())
  rejectionReason: string;
}
