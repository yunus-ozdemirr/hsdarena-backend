import { Body, Controller, Get, Put, Delete, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { QuizService } from './quiz.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guard';

@ApiTags('admin-quizzes')
@ApiBearerAuth('admin-token')
@Controller('admin/quizzes')
@UseGuards(AdminJwtGuard)
export class QuizController {
  constructor(private readonly service: QuizService) { }

  @Post()
  @ApiOperation({
    summary: 'Create a new quiz',
    description: 'Create a new quiz with questions and settings. Requires admin authentication.'
  })
  @ApiBody({ type: CreateQuizDto })
  @ApiResponse({
    status: 201,
    description: 'Quiz created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'quiz-uuid' },
        title: { type: 'string', example: 'Turkey Geography Quiz' },
        createdBy: { type: 'string', example: 'user-uuid' },
        createdAt: { type: 'string', example: '2025-12-15T10:30:00.000Z' },
        questionsCount: { type: 'number', example: 2 }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Req() req: any, @Body() dto: CreateQuizDto) {
    return this.service.createQuiz(req.user.sub, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all quizzes',
    description: 'Retrieve all quizzes created by the authenticated admin'
  })
  @ApiResponse({
    status: 200,
    description: 'Quizzes retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'quiz-uuid' },
          title: { type: 'string', example: 'Turkey Geography Quiz' },
          visibility: { type: 'string', example: 'private' },
          createdAt: { type: 'string', example: '2025-12-15T10:30:00.000Z' },
          questionsCount: { type: 'number', example: 5 }
        }
      }
    }
  })
  getAllQuizzes(@Req() req: any) {
    return this.service.getAllQuizzes(req.user.sub);
  }

  @Get(':quizId')
  @ApiOperation({
    summary: 'Get quiz details',
    description: 'Retrieve detailed information about a specific quiz'
  })
  @ApiParam({ name: 'quizId', description: 'Quiz ID' })
  @ApiResponse({
    status: 200,
    description: 'Quiz details retrieved successfully'
  })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  getQuiz(@Param('quizId') quizId: string) {
    return this.service.getQuizById(quizId);
  }

  @Put(':quizId')
  @ApiOperation({
    summary: 'Update quiz',
    description: 'Update quiz title and settings'
  })
  @ApiParam({ name: 'quizId', description: 'Quiz ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Updated Quiz Title' },
        settings: { type: 'object', example: { shuffleQuestions: true } }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Quiz updated successfully' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  updateQuiz(
    @Param('quizId') quizId: string,
    @Body() dto: { title?: string; settings?: any }
  ) {
    return this.service.updateQuiz(quizId, dto);
  }

  @Delete(':quizId')
  @ApiOperation({
    summary: 'Delete quiz',
    description: 'Delete a quiz and all associated questions'
  })
  @ApiParam({ name: 'quizId', description: 'Quiz ID' })
  @ApiResponse({
    status: 200,
    description: 'Quiz deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Quiz deleted successfully' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  deleteQuiz(@Param('quizId') quizId: string) {
    return this.service.deleteQuiz(quizId);
  }
}