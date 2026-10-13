import { Profile } from '@/modules/profile/domain/profile';
import { Mood, MOODS } from '@/modules/quack/domain/quack';
import { ApiProperty } from '@nestjs/swagger';

export class ProfileResponseDto {
  @ApiProperty({ example: 'CaffeinatedDuck' })
  username!: string;

  @ApiProperty({ example: 'Caffeinated Duck' })
  name!: string;

  @ApiProperty({ type: String, nullable: true })
  bio!: string | null;

  @ApiProperty({ enum: MOODS, nullable: true })
  defaultMood!: Mood | null;

  static fromDomain(profile: Profile): ProfileResponseDto {
    return {
      username: profile.username,
      name: profile.name,
      bio: profile.bio,
      defaultMood: profile.defaultMood,
    };
  }
}
