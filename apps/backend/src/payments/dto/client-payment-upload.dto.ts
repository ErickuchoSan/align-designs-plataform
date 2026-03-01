import { IsUUID, IsNumber, IsDateString, IsString, IsOptional, IsEnum, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentType } from '@prisma/client';

export class ClientPaymentUploadDto {
    @ApiPropertyOptional({
        description: 'Project ID for the payment. Required if invoiceId is not provided.',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsOptional()
    @IsUUID('4', { message: 'Project ID must be a valid UUID' })
    projectId?: string;

    @ApiPropertyOptional({
        description: 'Invoice ID if payment is for a specific invoice. Project ID will be fetched from invoice.',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsOptional()
    @IsUUID('4', { message: 'Invoice ID must be a valid UUID' })
    invoiceId?: string;

    @ApiProperty({
        description: 'Payment amount',
        example: 500.00,
        minimum: 0.01,
    })
    @IsNumber({}, { message: 'Amount must be a valid number' })
    @Min(0.01, { message: 'Amount must be at least 0.01' })
    @Type(() => Number)
    amount: number;

    @ApiProperty({
        description: 'Date when the payment was made',
        example: '2024-01-15',
    })
    @IsDateString({}, { message: 'Payment date must be a valid date string' })
    paymentDate: string;

    @ApiProperty({
        description: 'Payment method used',
        example: 'Bank Transfer',
    })
    @IsString({ message: 'Payment method must be a string' })
    @Transform(({ value }) => value?.trim())
    paymentMethod: string;

    @ApiPropertyOptional({
        description: 'Type of payment. If not provided, will be inferred from invoiceId.',
        enum: PaymentType,
        example: PaymentType.INVOICE,
    })
    @IsOptional()
    @IsEnum(PaymentType, { message: 'Payment type must be a valid PaymentType enum value' })
    type?: PaymentType;

    @ApiPropertyOptional({
        description: 'Additional notes about the payment',
        example: 'Payment for January invoice',
    })
    @IsOptional()
    @IsString({ message: 'Notes must be a string' })
    @Transform(({ value }) => value?.trim())
    notes?: string;
}
