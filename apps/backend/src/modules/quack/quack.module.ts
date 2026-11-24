import { PrismaModule } from '@/core/prisma/prisma.module';
import { AuthModule } from '@/shared/auth/auth.module';
import { Module } from '@nestjs/common';
import { LikesController } from './controllers/likes.controller';
import { PollsController } from './controllers/polls.controller';
import { QuacksController } from './controllers/quacks.controller';
import { LikeRepository } from './repositories/like.repository';
import { PollRepository } from './repositories/poll.repository';
import { QuackRepository } from './repositories/quack.repository';
import { LikesService } from './services/likes.service';
import { PollsService } from './services/polls.service';
import { QuacksService } from './services/quacks.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [QuacksController, PollsController, LikesController],
  providers: [
    QuacksService,
    QuackRepository,
    PollsService,
    PollRepository,
    LikesService,
    LikeRepository,
  ],
  exports: [QuacksService],
})
export class QuackModule {}
