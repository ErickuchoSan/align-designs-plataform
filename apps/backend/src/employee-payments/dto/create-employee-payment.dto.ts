import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmployeePaymentDto {
  @ApiProperty({ description: 'ID del proyecto' })
  @IsString()
  projectId: string;

  @ApiProperty({ description: 'ID del empleado que recibe el pago' })
  @IsString()
  employeeId: string;

  @ApiProperty({ description: 'Monto del pago', example: 1000.0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: 'Descripción del pago' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Método de pago',
    example: 'Transferencia Bancaria',
  })
  @IsString()
  paymentMethod: string;

  @ApiProperty({ description: 'Fecha del pago' })
  @IsDateString()
  paymentDate: string;

  @ApiPropertyOptional({ description: 'ID del archivo de comprobante' })
  @IsOptional()
  @IsString()
  receiptFileId?: string;
}
