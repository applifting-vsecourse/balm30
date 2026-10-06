import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SearchQuacksQueryDto {
  @ApiPropertyOptional({
    description:
      'Case-insensitive search in the quack text, author name and @username. A leading @ is ignored.',
    example: 'pond',
    maxLength: 280,
  })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  q?: string;
}
