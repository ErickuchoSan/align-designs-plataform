import {
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Sanitize } from '../../common/decorators/sanitize.decorator';
import { Transform } from 'class-transformer';
import { COMMENT_CONSTRAINTS } from '../../common/constants/validation.constants';
import { Stage } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @IsNotEmpty({ message: 'Comment cannot be empty' })
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MinLength(1, {
    message: 'Comment cannot be empty or contain only whitespace',
  })
  @MaxLength(COMMENT_CONSTRAINTS.MAX_LENGTH, {
    message: `Comment cannot exceed ${COMMENT_CONSTRAINTS.MAX_LENGTH} characters`,
  })
  @Sanitize()
  comment: string;

  @ApiPropertyOptional({
    enum: Stage,
    description: 'Stage where the comment belongs',
  })
  @IsOptional()
  @IsEnum(Stage, { message: 'Invalid stage value' })
  @Transform(({ value }) => {
    // If value is a string and matches a Stage enum, return it
    // If value is undefined or null, return undefined
    if (!value) return undefined;
    if (
      typeof value === 'string' &&
      Object.values(Stage).includes(value as Stage)
    ) {
      return value as Stage;
    }
    return value;
  })
  stage?: Stage;

  @ApiPropertyOptional({
    description:
      'ID of the file related to this comment (e.g. usage for rejection)',
  })
  @IsOptional()
  @IsString()
  relatedFileId?: string;
}
