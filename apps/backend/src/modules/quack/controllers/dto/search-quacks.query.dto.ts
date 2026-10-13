import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

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
}
