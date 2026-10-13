import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VoteDto {
  @ApiProperty({ description: 'Id of the answer to vote for' })
  @IsString()
  @IsNotEmpty()
  optionId!: string;
}
