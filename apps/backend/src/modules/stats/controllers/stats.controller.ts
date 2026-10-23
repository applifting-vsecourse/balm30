import { StatsService } from '@/modules/stats/services/stats.service';
import { Roles } from '@/shared/auth/decorators/roles.decorator';
import { ADMIN_ROLE } from '@/shared/auth/domain/identity';
import { AuthenticatedUserGuard } from '@/shared/auth/guards/authenticated-user.guard';
import { RolesGuard } from '@/shared/auth/guards/roles.guard';
import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { StatsResponseDto } from './dto/stats.response.dto';

@ApiTags('stats')
@Controller('stats')
@UseGuards(AuthenticatedUserGuard, RolesGuard)
@Roles(ADMIN_ROLE)
@ApiCookieAuth()
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  @ApiOperation({ summary: 'Numbers about the app, for admins only' })
  @ApiResponse({ status: 200, type: StatsResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 403, description: 'Not an admin' })
  async get(): Promise<StatsResponseDto> {
    const stats = await this.statsService.getStats();
    return StatsResponseDto.fromDomain(stats);
  }
}
