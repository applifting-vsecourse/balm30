import { PollsService } from '@/modules/quack/services/polls.service';
import { User } from '@/shared/auth/decorators/user.decorator';
import { Identity } from '@/shared/auth/domain/identity';
import { AuthenticatedUserGuard } from '@/shared/auth/guards/authenticated-user.guard';
import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
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
import { PollResponseDto } from './dto/poll.response.dto';
import { VoteDto } from './dto/vote.dto';

@ApiTags('polls')
@Controller('polls')
@UseGuards(AuthenticatedUserGuard)
@ApiCookieAuth()
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class PollsController {
  constructor(private readonly pollsService: PollsService) {}

  @Put(':pollId/vote')
  @ApiOperation({
    summary: 'Vote for an answer, or move an existing vote to it',
  })
  @ApiResponse({ status: 200, type: PollResponseDto })
  @ApiResponse({ status: 400, description: 'Answer is not part of the poll' })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 404, description: 'Poll does not exist' })
  @ApiResponse({ status: 409, description: 'Poll is closed' })
  async vote(
    @User() user: Identity,
    @Param('pollId') pollId: string,
    @Body() body: VoteDto,
  ): Promise<PollResponseDto> {
    const poll = await this.pollsService.vote(user, pollId, body.optionId);
    return PollResponseDto.fromDomain(poll);
  }

  @Post(':pollId/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Close your own poll for good; succeeds if it is already closed',
  })
  @ApiResponse({ status: 200, type: PollResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 403, description: 'Not the author of the poll' })
  @ApiResponse({ status: 404, description: 'Poll does not exist' })
  async close(
    @User() user: Identity,
    @Param('pollId') pollId: string,
  ): Promise<PollResponseDto> {
    const poll = await this.pollsService.closePoll(user, pollId);
    return PollResponseDto.fromDomain(poll);
  }

  @Delete(':pollId/vote')
  @ApiOperation({ summary: 'Remove your vote; succeeds if there was none' })
  @ApiResponse({ status: 200, type: PollResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 404, description: 'Poll does not exist' })
  @ApiResponse({ status: 409, description: 'Poll is closed' })
  async removeVote(
    @User() user: Identity,
    @Param('pollId') pollId: string,
  ): Promise<PollResponseDto> {
    const poll = await this.pollsService.removeVote(user, pollId);
    return PollResponseDto.fromDomain(poll);
  }
}
