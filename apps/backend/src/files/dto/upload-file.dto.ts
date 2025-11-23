import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Sanitize } from '../../common/decorators/sanitize.decorator';
import { Transform } from 'class-transformer';
import { COMMENT_CONSTRAINTS } from '../../common/constants/validation.constants';

export class UploadFileDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MaxLength(COMMENT_CONSTRAINTS.MAX_LENGTH, {
    message: `Comment cannot exceed ${COMMENT_CONSTRAINTS.MAX_LENGTH} characters`,
  })
  @Sanitize()
  comment?: string;
}
