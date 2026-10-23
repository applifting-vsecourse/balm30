import { RECENT_DAYS, Stats } from '@/modules/stats/domain/stats';
import { StatsRepository } from '@/modules/stats/repositories/stats.repository';
import { Injectable } from '@nestjs/common';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class StatsService {
  constructor(private readonly statsRepository: StatsRepository) {}

  async getStats(now: Date = new Date()): Promise<Stats> {
    const recentSince = new Date(now.getTime() - RECENT_DAYS * DAY_MS);
    return this.statsRepository.getStats(recentSince);
  }
}
