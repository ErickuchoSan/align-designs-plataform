import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Sanitize } from '../../common/decorators/sanitize.decorator';
import { COMMENT_CONSTRAINTS } from '../../common/constants/validation.constants';

export class UploadFileDto {
  @IsOptional()
  @IsString()
  @MaxLength(COMMENT_CONSTRAINTS.MAX_LENGTH, {
    message: `Comment cannot exceed ${COMMENT_CONSTRAINTS.MAX_LENGTH} characters`,
  })
  @Sanitize()
  comment?: string;
}
