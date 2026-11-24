import {
  QUACK_SCOPES,
  QUACK_SORTS,
  QuackScope,
  QuackSort,
} from '@/modules/quack/domain/quack';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class SearchQuacksQueryDto {
  @ApiPropertyOptional({
    description:
      "Case-insensitive search in the quack text, author name, @username and poll question (not the poll's answers). A leading @ is ignored.",
    example: 'pond',
    maxLength: 280,
  })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  q?: string;

  @ApiPropertyOptional({
    description:
      "Whose quacks to list: everyone's, or only the signed-in user's.",
    enum: QUACK_SCOPES,
    default: 'all',
  })
  @IsOptional()
  @IsIn(QUACK_SCOPES)
  scope?: QuackScope;

  @ApiPropertyOptional({
    description:
      'Order: newest first, or most liked first with ties newest first.',
    enum: QUACK_SORTS,
    default: 'newest',
  })
  @IsOptional()
  @IsIn(QUACK_SORTS)
  sort?: QuackSort;
}
