import { ApiProperty } from '@nestjs/swagger';

export class LikeResponseDto {
  @ApiProperty({ description: 'Likes on the quack, from everyone' })
  likeCount!: number;

  @ApiProperty({ description: 'Whether the signed-in user likes the quack' })
  likedByMe!: boolean;
}
