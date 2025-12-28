import { IsNumber, IsPositive, IsOptional, IsString } from 'class-validator';

/**
 * DTO for recording a payment to a project
 *
 * If payment completes initialAmountRequired, project will auto-activate
 */
export class RecordPaymentDto {
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Amount must be a number with maximum 2 decimal places' },
  )
  @IsPositive({ message: 'Amount must be positive' })
  amount: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
