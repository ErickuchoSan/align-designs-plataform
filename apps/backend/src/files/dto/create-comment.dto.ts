import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { Sanitize } from '../../common/decorators/sanitize.decorator';
import { Transform } from 'class-transformer';

export class CreateCommentDto {
  @IsNotEmpty({ message: 'Comment cannot be empty' })
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MinLength(1, {
    message: 'Comment cannot be empty or contain only whitespace',
  })
  @MaxLength(2000, { message: 'Comment cannot exceed 2000 characters' })
  @Sanitize()
  comment: string;
}
