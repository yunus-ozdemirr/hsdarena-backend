import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateEmailDto {
    @ApiProperty({
        description: 'New email address',
        example: 'newemail@example.com',
    })
    @IsEmail()
    @IsNotEmpty()
    newEmail: string;

    @ApiProperty({
        description: 'Current password for verification',
        example: 'currentPassword123',
    })
    @IsNotEmpty()
    currentPassword: string;
}
