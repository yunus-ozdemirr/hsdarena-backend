import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePasswordDto {
    @ApiProperty({
        description: 'Current password',
        example: 'currentPassword123',
    })
    @IsNotEmpty()
    @IsString()
    currentPassword: string;

    @ApiProperty({
        description: 'New password (minimum 6 characters)',
        example: 'newPassword456',
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    newPassword: string;
}
