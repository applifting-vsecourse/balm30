import { ConfigModule } from '@applifting-io/nestjs-decorated-config';
import { Module } from '@nestjs/common';
import { ProfileModule } from './modules/profile/profile.module';
import { QuackModule } from './modules/quack/quack.module';
import { StatsModule } from './modules/stats/stats.module';
import { WelcomeModule } from './modules/welcome/welcome.module';
import { AuthModule } from './shared/auth/auth.module';
import { Config } from './shared/config/config.service';

const imports = [
  ConfigModule.forRootAsync(Config, { validate: true }),
  AuthModule,
  WelcomeModule,
  QuackModule,
  ProfileModule,
  StatsModule,
];

@Module({
  imports,
})
export class AppModule {}
