import { IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ApprovePaymentDto {
    @ApiPropertyOptional({
        description: 'Corrected amount if the original amount was incorrect',
        example: 150.00,
        minimum: 0.01,
    })
    @IsOptional()
    @IsNumber({}, { message: 'Corrected amount must be a valid number' })
    @Min(0.01, { message: 'Corrected amount must be at least 0.01' })
    @Type(() => Number)
    correctedAmount?: number;
}
