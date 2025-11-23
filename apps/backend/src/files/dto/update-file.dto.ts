import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Sanitize } from '../../common/decorators/sanitize.decorator';
import { Transform } from 'class-transformer';
import { COMMENT_CONSTRAINTS } from '../../common/constants/validation.constants';

export class UpdateFileDto {
  @IsOptional()
  @ValidateIf((o) => o.comment !== null && o.comment !== undefined)
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MinLength(1, {
    message: 'Comment cannot be empty or contain only whitespace',
  })
  @MaxLength(COMMENT_CONSTRAINTS.MAX_LENGTH, {
    message: `Comment cannot exceed ${COMMENT_CONSTRAINTS.MAX_LENGTH} characters`,
  })
  @Sanitize()
  comment?: string | null; // null to remove the comment
}
