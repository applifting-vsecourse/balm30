import { RECENT_DAYS, Stats } from '@/modules/stats/domain/stats';
import { ApiProperty } from '@nestjs/swagger';

export class StatsResponseDto {
  @ApiProperty({ description: 'Registered users' })
  users!: number;

  @ApiProperty({ description: 'Quacks in total' })
  quacks!: number;

  @ApiProperty({ description: 'Quacks with a poll' })
  polls!: number;

  @ApiProperty({ description: 'Votes in all polls' })
  votes!: number;

  @ApiProperty({
    description: `Quacks posted in the last ${RECENT_DAYS} days`,
  })
  recentQuacks!: number;

  @ApiProperty({
    description: 'How many days "recent" covers',
    example: RECENT_DAYS,
  })
  recentDays!: number;

  static fromDomain(stats: Stats): StatsResponseDto {
    return { ...stats, recentDays: RECENT_DAYS };
  }
}
