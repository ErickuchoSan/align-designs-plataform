import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Sanitize } from '../../common/decorators/sanitize.decorator';

export class UploadFileDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Comment cannot exceed 2000 characters' })
  @Sanitize()
  comment?: string;
}
