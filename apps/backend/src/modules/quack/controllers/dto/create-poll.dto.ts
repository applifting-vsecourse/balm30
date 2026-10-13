import {
  POLL_MAX_OPTIONS,
  POLL_MIN_OPTIONS,
  POLL_OPTION_MAX_LENGTH,
  POLL_QUESTION_MAX_LENGTH,
} from '@/modules/quack/domain/poll';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

const trim = (value: unknown): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreatePollDto {
  @ApiProperty({
    example: "Where should we hold Saturday's picnic?",
    maxLength: POLL_QUESTION_MAX_LENGTH,
  })
  @Transform(({ value }) => trim(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(POLL_QUESTION_MAX_LENGTH)
  question!: string;

  @ApiProperty({
    description: `${POLL_MIN_OPTIONS} to ${POLL_MAX_OPTIONS} answers, in display order, different from each other ignoring case`,
    type: [String],
    example: ['North end', 'West bank'],
  })
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map(trim) : (value as unknown),
  )
  @IsArray()
  @ArrayMinSize(POLL_MIN_OPTIONS)
  @ArrayMaxSize(POLL_MAX_OPTIONS)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(POLL_OPTION_MAX_LENGTH, { each: true })
  @ArrayUnique((option: string) => option.toLowerCase(), {
    message: 'poll answers must be different from each other',
  })
  options!: string[];
}
