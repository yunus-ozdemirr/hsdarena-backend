import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { QuizService } from './quiz.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guard';

@ApiTags('quiz')
@ApiBearerAuth('admin-token')
@Controller('quiz')
export class QuizController {
  constructor(private readonly service: QuizService) { }

  @UseGuards(AdminJwtGuard)
  @Post('create')
  @ApiOperation({
    summary: 'Create a new quiz',
    description: 'Create a new quiz with questions and settings. Requires admin authentication.'
  })
  @ApiBody({
    type: CreateQuizDto,
    description: 'Quiz creation data',
    examples: {
      example1: {
        summary: 'Turkey Geography Quiz',
        description: 'Example quiz with MCQ and True/False questions',
        value: {
          title: 'Turkey Geography Quiz',
          settings: {
            shuffleQuestions: true,
            showCorrectAnswers: false,
            allowRetake: true
          },
          questions: [
            {
              index: 1,
              text: 'What is the capital of Turkey?',
              type: 'MCQ',
              choices: [
                { id: 'choice_1', text: 'Istanbul' },
                { id: 'choice_2', text: 'Ankara' },
                { id: 'choice_3', text: 'Izmir' },
                { id: 'choice_4', text: 'Bursa' }
              ],
              correctAnswer: 'choice_2',
              timeLimitSec: 30,
              points: 10
            },
            {
              index: 2,
              text: 'Is Turkey located in Europe?',
              type: 'TF',
              correctAnswer: true,
              timeLimitSec: 15,
              points: 5
            }
          ]
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Quiz created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'quiz_123' },
        title: { type: 'string', example: 'Turkey Geography Quiz' },
        adminId: { type: 'string', example: 'admin_123' },
        createdAt: { type: 'string', example: '2024-01-15T10:30:00Z' },
        questionsCount: { type: 'number', example: 2 }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing admin token',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
        error: { type: 'string', example: 'Unauthorized' }
      }
    }
  })
  create(@Req() req: any, @Body() dto: CreateQuizDto) {
    // req.user.sub -> admin id
    return this.service.createQuiz(req.user.sub, dto);
  }

  @UseGuards(AdminJwtGuard)
  @Post(':quizId/session')
  @ApiOperation({
    summary: 'Create a quiz session',
    description: 'Create a new session for an existing quiz. Requires admin authentication.'
  })
  @ApiParam({
    name: 'quizId',
    description: 'Quiz ID to create session for',
    example: 'quiz_123',
    type: 'string'
  })
  @ApiBody({
    type: CreateSessionDto,
    description: 'Session creation data (empty body)',
    examples: {
      example1: {
        summary: 'Empty Session Body',
        description: 'Session creation requires empty body',
        value: {}
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Session created successfully',
    schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', example: 'session_456' },
        quizId: { type: 'string', example: 'quiz_123' },
        status: { type: 'string', example: 'waiting' },
        createdAt: { type: 'string', example: '2024-01-15T10:30:00Z' },
        joinCode: { type: 'string', example: 'ABC123' }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Quiz not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Quiz not found' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  createSession(@Param('quizId') quizId: string, @Body() _dto: CreateSessionDto) {
    return this.service.createSession(quizId);
  }

  @UseGuards(AdminJwtGuard)
  @Get(':quizId/questions')
  @ApiOperation({
    summary: 'Get quiz questions',
    description: 'Retrieve all questions for a specific quiz. Requires admin authentication.'
  })
  @ApiParam({
    name: 'quizId',
    description: 'Quiz ID to get questions for',
    example: 'quiz_123',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Questions retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'question_1' },
          index: { type: 'number', example: 1 },
          text: { type: 'string', example: 'What is the capital of Turkey?' },
          type: { type: 'string', example: 'MCQ' },
          choices: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'choice_1' },
                text: { type: 'string', example: 'Istanbul' }
              }
            }
          },
          timeLimitSec: { type: 'number', example: 30 },
          points: { type: 'number', example: 10 }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Quiz not found'
  })
  getQuizQuestions(@Param('quizId') quizId: string) {
    return this.service.getQuizQuestions(quizId);
  }

  @Get(':quizId')
  @ApiOperation({
    summary: 'Get quiz details',
    description: 'Retrieve quiz details by quiz ID. Public endpoint.'
  })
  @ApiParam({
    name: 'quizId',
    description: 'Quiz ID to get details for',
    example: 'quiz_123',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Quiz retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        quizId: { type: 'string', example: 'quiz_123' },
        quizTitle: { type: 'string', example: 'Turkey Geography Quiz' },
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'question_1' },
              index: { type: 'number', example: 1 },
              text: { type: 'string', example: 'What is the capital of Turkey?' },
              type: { type: 'string', example: 'MCQ' },
              choices: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: 'choice_1' },
                    text: { type: 'string', example: 'Istanbul' }
                  }
                }
              },
              timeLimitSec: { type: 'number', example: 30 },
              points: { type: 'number', example: 10 }
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Quiz not found'
  })
  getQuiz(@Param('quizId') quizId: string) {
    return this.service.getQuizQuestions(quizId);
  }

  @Get('session/:sessionCode/questions')
  @ApiOperation({
    summary: 'Get session questions',
    description: 'Retrieve questions for a specific quiz session by session code. Public endpoint.'
  })
  @ApiParam({
    name: 'sessionCode',
    description: 'Session code to get questions for',
    example: 'ABC123',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Session questions retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'question_1' },
          index: { type: 'number', example: 1 },
          text: { type: 'string', example: 'What is the capital of Turkey?' },
          type: { type: 'string', example: 'MCQ' },
          choices: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'choice_1' },
                text: { type: 'string', example: 'Istanbul' }
              }
            }
          },
          timeLimitSec: { type: 'number', example: 30 },
          points: { type: 'number', example: 10 }
        }
      }
    }
  })
  getSessionQuestions(@Param('sessionCode') sessionCode: string) {
    return this.service.getSessionQuestions(sessionCode);
  }

  @Get('session/:sessionCode/current-question')
  @ApiOperation({
    summary: 'Get current active question',
    description: 'Retrieve only the current active question for a specific quiz session. This prevents teams from seeing all questions via browser DevTools. Public endpoint.'
  })
  @ApiParam({
    name: 'sessionCode',
    description: 'Session code to get current question for',
    example: 'ABC123',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Current question retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', example: 'uuid-here' },
        sessionCode: { type: 'string', example: 'ABC123' },
        currentQuestionIndex: { type: 'number', example: 0 },
        totalQuestions: { type: 'number', example: 10 },
        question: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'question-uuid' },
            index: { type: 'number', example: 1 },
            text: { type: 'string', example: 'What is 5 + 3?' },
            type: { type: 'string', example: 'MCQ' },
            choices: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'A' },
                  text: { type: 'string', example: '8' }
                }
              }
            },
            timeLimitSec: { type: 'number', example: 30 },
            points: { type: 'number', example: 100 }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Session or question not found'
  })
  getCurrentQuestion(@Param('sessionCode') sessionCode: string) {
    return this.service.getCurrentQuestion(sessionCode);
  }
}