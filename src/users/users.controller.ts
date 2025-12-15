import { Controller, Patch, Delete, Body, Req, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateEmailDto } from './dto/update-email.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guard';

@ApiTags('users')
@ApiBearerAuth('admin-token')
@Controller('users')
@UseGuards(AdminJwtGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Patch('me/email')
    @ApiOperation({
        summary: 'Update user email',
        description: 'Update the email address of the authenticated user. Requires current password for verification.'
    })
    @ApiBody({ type: UpdateEmailDto })
    @ApiResponse({
        status: 200,
        description: 'Email updated successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Email updated successfully' },
                user: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'user-uuid' },
                        email: { type: 'string', example: 'newemail@example.com' },
                        createdAt: { type: 'string', example: '2025-12-15T10:00:00.000Z' }
                    }
                }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Invalid password' })
    @ApiResponse({ status: 409, description: 'Email already in use' })
    async updateEmail(@Req() req: any, @Body() dto: UpdateEmailDto) {
        const userId = req.user.sub;
        return this.usersService.updateEmail(userId, dto);
    }

    @Patch('me/password')
    @ApiOperation({
        summary: 'Update user password',
        description: 'Update the password of the authenticated user. Requires current password for verification.'
    })
    @ApiBody({ type: UpdatePasswordDto })
    @ApiResponse({
        status: 200,
        description: 'Password updated successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Password updated successfully' }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Current password is incorrect' })
    async updatePassword(@Req() req: any, @Body() dto: UpdatePasswordDto) {
        const userId = req.user.sub;
        return this.usersService.updatePassword(userId, dto);
    }

    @Delete('me')
    @HttpCode(200)
    @ApiOperation({
        summary: 'Delete user account',
        description: 'Permanently delete the authenticated user account and all associated data.'
    })
    @ApiResponse({
        status: 200,
        description: 'Account deleted successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Account deleted successfully' }
            }
        }
    })
    @ApiResponse({ status: 404, description: 'User not found' })
    async deleteAccount(@Req() req: any) {
        const userId = req.user.sub;
        return this.usersService.deleteAccount(userId);
    }
}
