import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSessionDto {
    @ApiProperty({
        description: 'Session start time (optional)',
        example: '2025-12-15T10:00:00.000Z',
        required: false
    })
    @IsOptional()
    @IsString()
    startsAt?: string;
}
