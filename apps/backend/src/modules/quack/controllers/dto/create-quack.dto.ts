import {
  Mood,
  MOODS,
  QUACK_TEXT_MAX_LENGTH,
} from '@/modules/quack/domain/quack';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CreatePollDto } from './create-poll.dto';

export class CreateQuackDto {
  @ApiPropertyOptional({
    description: 'Body of the quack; required unless the quack has a poll',
    example: 'Hello, world!',
    maxLength: QUACK_TEXT_MAX_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MaxLength(QUACK_TEXT_MAX_LENGTH)
  text?: string;

  @ApiPropertyOptional({
    description: 'Mood of the quack; omit or send null for no mood',
    enum: MOODS,
    nullable: true,
    example: 'happy',
  })
  @IsOptional()
  @IsIn(MOODS)
  mood?: Mood | null;

  @ApiPropertyOptional({
    description: 'Poll attached to the quack; omit or send null for none',
    type: CreatePollDto,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePollDto)
  poll?: CreatePollDto | null;
}
