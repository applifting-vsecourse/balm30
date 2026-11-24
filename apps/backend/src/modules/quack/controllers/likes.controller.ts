import { LikesService } from '@/modules/quack/services/likes.service';
import { User } from '@/shared/auth/decorators/user.decorator';
import { Identity } from '@/shared/auth/domain/identity';
import { AuthenticatedUserGuard } from '@/shared/auth/guards/authenticated-user.guard';
import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { LikeResponseDto } from './dto/like.response.dto';

@ApiTags('quacks')
@Controller('quacks/:quackId/like')
@UseGuards(AuthenticatedUserGuard)
@ApiCookieAuth()
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Like a quack. Liking it again changes nothing' })
  @ApiResponse({ status: 200, type: LikeResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({
    status: 404,
    description: 'Quack does not exist or is deleted',
  })
  async like(
    @User() user: Identity,
    @Param('quackId') quackId: string,
  ): Promise<LikeResponseDto> {
    return this.likesService.likeQuack(user, quackId);
  }

  @Delete()
  @ApiOperation({
    summary: 'Take back your like. Without a like it changes nothing',
  })
  @ApiResponse({ status: 200, type: LikeResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({
    status: 404,
    description: 'Quack does not exist or is deleted',
  })
  async unlike(
    @User() user: Identity,
    @Param('quackId') quackId: string,
  ): Promise<LikeResponseDto> {
    return this.likesService.unlikeQuack(user, quackId);
  }
}
