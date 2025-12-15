import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinTeamDto {
    @ApiProperty({
        description: 'Session code to join',
        example: 'ABC123'
    })
    @IsString()
    @IsNotEmpty()
    sessionCode: string;

    @ApiProperty({
        description: 'Team name',
        example: 'Red Dragons'
    })
    @IsString()
    @IsNotEmpty()
    teamName: string;
}
