import {
  isDeleted,
  Mood,
  MOODS,
  Quack,
  QuackThread,
} from '@/modules/quack/domain/quack';
import { ApiProperty } from '@nestjs/swagger';
import { PollResponseDto } from './poll.response.dto';

class QuackUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  username!: string;
}

class ReplyingToDto {
  @ApiProperty()
  quackId!: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description:
      'Username of the parent author; null when the parent is deleted',
  })
  username!: string | null;
}

export class QuackResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ description: 'Empty for a deleted quack' })
  text!: string;

  @ApiProperty({ enum: MOODS, nullable: true })
  mood!: Mood | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Null for a deleted quack',
  })
  userId!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({
    type: QuackUserDto,
    nullable: true,
    description: 'Null for a deleted quack',
  })
  user!: QuackUserDto | null;

  @ApiProperty({ type: PollResponseDto, nullable: true })
  poll!: PollResponseDto | null;

  @ApiProperty({
    description:
      'A deleted quack is a placeholder kept so that its replies keep their parent',
  })
  isDeleted!: boolean;

  @ApiProperty({
    type: ReplyingToDto,
    nullable: true,
    description: 'The quack this one replies to; null for a top-level quack',
  })
  replyingTo!: ReplyingToDto | null;

  @ApiProperty({ description: 'Number of replies that are not deleted' })
  replyCount!: number;

  @ApiProperty({
    description:
      'Whether the signed-in user can delete this quack: they wrote it, or they are an admin',
  })
  canDelete!: boolean;

  static fromDomain(quack: Quack): QuackResponseDto {
    const thread = {
      id: quack.id,
      createdAt: quack.createdAt,
      replyingTo: quack.replyingTo,
      replyCount: quack.replyCount,
    };
    if (isDeleted(quack)) {
      return {
        ...thread,
        text: '',
        mood: null,
        userId: null,
        user: null,
        poll: null,
        isDeleted: true,
        canDelete: false,
      };
    }
    if (!quack.user) {
      throw new Error(
        `QuackResponseDto.fromDomain expected quack.user to be loaded for quack ${quack.id}`,
      );
    }
    return {
      ...thread,
      text: quack.text,
      mood: quack.mood,
      userId: quack.userId,
      user: {
        id: quack.user.id,
        name: quack.user.name,
        username: quack.user.username,
      },
      poll: quack.poll ? PollResponseDto.fromDomain(quack.poll) : null,
      isDeleted: false,
      canDelete: quack.canDelete,
    };
  }
}

export class QuackThreadResponseDto {
  @ApiProperty({ type: QuackResponseDto })
  quack!: QuackResponseDto;

  @ApiProperty({
    type: [QuackResponseDto],
    description:
      'Direct replies, oldest first. Deleted replies appear only when they have replies of their own',
  })
  replies!: QuackResponseDto[];

  static fromDomain(thread: QuackThread): QuackThreadResponseDto {
    return {
      quack: QuackResponseDto.fromDomain(thread.quack),
      replies: thread.replies.map(QuackResponseDto.fromDomain),
    };
  }
}
