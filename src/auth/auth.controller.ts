import { Body, Controller, Post, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) { }

  @Post('register')
  @ApiOperation({
    summary: 'Register new admin user',
    description: 'Create a new admin account and return JWT token'
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Registration successful',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'user-uuid' },
            email: { type: 'string', example: 'admin@example.com' },
            role: { type: 'string', example: 'admin' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto.email, dto.password);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Admin login',
    description: 'Authenticate admin user and return JWT token'
  })
  @ApiBody({
    type: LoginDto,
    description: 'Admin login credentials',
    examples: {
      example1: {
        summary: 'Admin Login Example',
        description: 'Example admin login request with real credentials',
        value: {
          email: 'admin@example.com',
          password: 'Admin123!'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'admin_123' },
            email: { type: 'string', example: 'admin@example.com' },
            role: { type: 'string', example: 'admin' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Invalid credentials' },
        error: { type: 'string', example: 'Unauthorized' }
      }
    }
  })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Post('logout')
  @ApiBearerAuth('admin-token')
  @UseGuards(AdminJwtGuard)
  @ApiOperation({
    summary: 'Logout admin user',
    description: 'Logout the authenticated admin user'
  })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Logged out successfully' }
      }
    }
  })
  logout() {
    return this.auth.logout();
  }

  @Get('me')
  @ApiBearerAuth('admin-token')
  @UseGuards(AdminJwtGuard)
  @ApiOperation({
    summary: 'Get current user info',
    description: 'Get authenticated admin user information'
  })
  @ApiResponse({
    status: 200,
    description: 'User information retrieved',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'user-uuid' },
        email: { type: 'string', example: 'admin@example.com' },
        createdAt: { type: 'string', example: '2025-12-15T10:00:00.000Z' },
        role: { type: 'string', example: 'admin' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  getMe(@Req() req: any) {
    return this.auth.getMe(req.user.sub);
  }
}
