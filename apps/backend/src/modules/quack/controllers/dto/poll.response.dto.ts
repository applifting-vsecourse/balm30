import { Poll } from '@/modules/quack/domain/poll';
import { ApiProperty } from '@nestjs/swagger';

class PollOptionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  text!: string;
}

export class PollResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  question!: string;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  closedAt!: Date | null;

  @ApiProperty({ type: [PollOptionResponseDto] })
  options!: PollOptionResponseDto[];

  static fromDomain(poll: Poll): PollResponseDto {
    return {
      id: poll.id,
      question: poll.question,
      closedAt: poll.closedAt,
      options: poll.options.map((option) => ({
        id: option.id,
        text: option.text,
      })),
    };
  }
}
