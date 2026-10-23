import { Stats } from '@/modules/stats/domain/stats';
import { StatsRepository } from '@/modules/stats/repositories/stats.repository';
import { mock } from 'jest-mock-extended';
import { StatsService } from './stats.service';

const stats: Stats = {
  users: 6,
  quacks: 15,
  polls: 3,
  votes: 9,
  recentQuacks: 4,
};

describe('StatsService', () => {
  it('counts recent quacks from exactly 7 days ago', async () => {
    const repository = mock<StatsRepository>();
    repository.getStats.mockResolvedValue(stats);

    const service = new StatsService(repository);

    await expect(
      service.getStats(new Date('2026-10-24T12:00:00Z')),
    ).resolves.toEqual(stats);
    expect(repository.getStats).toHaveBeenCalledWith(
      new Date('2026-10-17T12:00:00Z'),
    );
  });
});
