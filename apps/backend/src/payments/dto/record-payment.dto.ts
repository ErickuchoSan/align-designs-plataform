import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod, PaymentType } from '@prisma/client';

export class RecordPaymentDto {
    @IsUUID()
    @IsNotEmpty()
    projectId: string;

    @IsEnum(PaymentType)
    @IsNotEmpty()
    type: PaymentType;

    @IsNumber()
    @Min(0.01)
    @Type(() => Number)
    amount: number;

    @IsEnum(PaymentMethod)
    @IsNotEmpty()
    paymentMethod: PaymentMethod;

    @IsString()
    @IsNotEmpty()
    paymentDate: string; // ISO Date string

    @IsString()
    @IsOptional()
    notes?: string;

    @IsUUID()
    @IsOptional()
    fromUserId?: string;

    @IsUUID()
    @IsOptional()
    toUserId?: string;

    @IsOptional()
    @IsUUID('4', { each: true })
    relatedFileIds?: string[];

    @IsUUID()
    @IsOptional()
    invoiceId?: string;
}
