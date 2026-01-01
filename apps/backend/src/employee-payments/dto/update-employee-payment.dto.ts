import { PartialType } from '@nestjs/swagger';
import { CreateEmployeePaymentDto } from './create-employee-payment.dto';

export class UpdateEmployeePaymentDto extends PartialType(CreateEmployeePaymentDto) {}
