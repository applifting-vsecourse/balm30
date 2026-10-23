import { PrismaModule } from '@/core/prisma/prisma.module';
import { AuthModule } from '@/shared/auth/auth.module';
import { Module } from '@nestjs/common';
import { StatsController } from './controllers/stats.controller';
import { StatsRepository } from './repositories/stats.repository';
import { StatsService } from './services/stats.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [StatsController],
  providers: [StatsService, StatsRepository],
})
export class StatsModule {}
