import { QuacksService } from '@/modules/quack/services/quacks.service';
import { User } from '@/shared/auth/decorators/user.decorator';
import { Identity } from '@/shared/auth/domain/identity';
import { AuthenticatedUserGuard } from '@/shared/auth/guards/authenticated-user.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateQuackDto } from './dto/create-quack.dto';
import { QuackResponseDto } from './dto/quack.response.dto';
import { SearchQuacksQueryDto } from './dto/search-quacks.query.dto';

@ApiTags('quacks')
@Controller('quacks')
@UseGuards(AuthenticatedUserGuard)
@ApiCookieAuth()
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class QuacksController {
  constructor(private readonly quacksService: QuacksService) {}

  @Get()
  @ApiOperation({
    summary: 'List quacks, optionally filtered by a search or to your own',
  })
  @ApiResponse({ status: 200, type: [QuackResponseDto] })
  @ApiResponse({ status: 400, description: 'Invalid search' })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  async list(
    @User() user: Identity,
    @Query() query: SearchQuacksQueryDto,
  ): Promise<QuackResponseDto[]> {
    const quacks = await this.quacksService.getQuacks(user, {
      search: query.q,
      scope: query.scope,
    });
    return quacks.map(QuackResponseDto.fromDomain);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a quack' })
  @ApiResponse({ status: 201, type: QuackResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid quack or poll' })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  async create(
    @User() user: Identity,
    @Body() body: CreateQuackDto,
  ): Promise<QuackResponseDto> {
    const quack = await this.quacksService.createQuack(user, {
      text: body.text,
      mood: body.mood,
      poll: body.poll,
    });
    return QuackResponseDto.fromDomain(quack);
  }

  @Delete(':quackId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete your own quack, with its poll and votes' })
  @ApiResponse({ status: 204, description: 'Quack deleted' })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 403, description: 'Not the author of the quack' })
  @ApiResponse({ status: 404, description: 'Quack does not exist' })
  async delete(
    @User() user: Identity,
    @Param('quackId') quackId: string,
  ): Promise<void> {
    await this.quacksService.deleteQuack(user, quackId);
  }
}
