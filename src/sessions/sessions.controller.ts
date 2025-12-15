import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guard';
import { TeamJwtGuard } from '../common/guards/team-jwt.guard';

@ApiTags('sessions')
@Controller()
export class SessionsController {
    constructor(private readonly sessionsService: SessionsService) { }

    // Admin endpoints
    @Post('admin/quizzes/:quizId/session')
    @ApiBearerAuth('admin-token')
    @UseGuards(AdminJwtGuard)
    @ApiOperation({
        summary: 'Create session for quiz',
        description: 'Create a new quiz session with a unique session code'
    })
    @ApiParam({ name: 'quizId', description: 'Quiz ID' })
    @ApiBody({ type: CreateSessionDto })
    @ApiResponse({
        status: 201,
        description: 'Session created successfully',
        schema: {
            type: 'object',
            properties: {
                sessionId: { type: 'string', example: 'session-uuid' },
                sessionCode: { type: 'string', example: 'ABC123' },
                quizId: { type: 'string', example: 'quiz-uuid' },
                status: { type: 'string', example: 'CREATED' }
            }
        }
    })
    @ApiResponse({ status: 404, description: 'Quiz not found' })
    @ApiResponse({ status: 400, description: 'Quiz has no questions' })
    async createSession(
        @Param('quizId') quizId: string,
        @Body() dto: CreateSessionDto
    ) {
        return this.sessionsService.createSession(quizId, dto);
    }

    @Get('admin/sessions/:sessionCode')
    @ApiBearerAuth('admin-token')
    @UseGuards(AdminJwtGuard)
    @ApiOperation({
        summary: 'Get session details',
        description: 'Get detailed information about a session including quiz and teams'
    })
    @ApiParam({ name: 'sessionCode', description: 'Session code' })
    @ApiResponse({ status: 200, description: 'Session details retrieved' })
    @ApiResponse({ status: 404, description: 'Session not found' })
    async getSession(@Param('sessionCode') sessionCode: string) {
        return this.sessionsService.getSessionByCode(sessionCode);
    }

    @Get('admin/sessions/:sessionCode/scoreboard')
    @ApiBearerAuth('admin-token')
    @UseGuards(AdminJwtGuard)
    @ApiOperation({
        summary: 'Get session scoreboard',
        description: 'Get the leaderboard for a specific session'
    })
    @ApiParam({ name: 'sessionCode', description: 'Session code' })
    @ApiResponse({
        status: 200,
        description: 'Scoreboard retrieved',
        schema: {
            type: 'object',
            properties: {
                sessionCode: { type: 'string', example: 'ABC123' },
                leaderboard: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            teamId: { type: 'string', example: 'team-uuid' },
                            teamName: { type: 'string', example: 'Red Dragons' },
                            score: { type: 'number', example: 150 }
                        }
                    }
                }
            }
        }
    })
    @ApiResponse({ status: 404, description: 'Session not found' })
    async getScoreboard(@Param('sessionCode') sessionCode: string) {
        return this.sessionsService.getSessionScoreboard(sessionCode);
    }

    @Post('admin/sessions/:sessionCode/start')
    @ApiBearerAuth('admin-token')
    @UseGuards(AdminJwtGuard)
    @ApiOperation({
        summary: 'Start session',
        description: 'Activate a session to allow teams to start answering questions'
    })
    @ApiParam({ name: 'sessionCode', description: 'Session code' })
    @ApiResponse({
        status: 200,
        description: 'Session started successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Session started successfully' },
                sessionCode: { type: 'string', example: 'ABC123' },
                status: { type: 'string', example: 'ACTIVE' }
            }
        }
    })
    @ApiResponse({ status: 404, description: 'Session not found' })
    async startSession(@Param('sessionCode') sessionCode: string) {
        return this.sessionsService.startSession(sessionCode);
    }

    // Team endpoints
    @Get('sessions/:sessionCode/quiz')
    @ApiOperation({
        summary: 'Get quiz for session (Team access)',
        description: 'Get basic quiz information for a session'
    })
    @ApiParam({ name: 'sessionCode', description: 'Session code' })
    @ApiResponse({ status: 200, description: 'Quiz information retrieved' })
    @ApiResponse({ status: 404, description: 'Session not found' })
    async getQuiz(@Param('sessionCode') sessionCode: string) {
        return this.sessionsService.getQuizForSession(sessionCode);
    }

    @Get('sessions/:sessionCode/question/current')
    @ApiOperation({
        summary: 'Get current question (Team access)',
        description: 'Get the currently active question for a session'
    })
    @ApiParam({ name: 'sessionCode', description: 'Session code' })
    @ApiResponse({ status: 200, description: 'Current question retrieved' })
    @ApiResponse({ status: 404, description: 'Session not found or no current question' })
    @ApiResponse({ status: 400, description: 'Session has not started' })
    async getCurrentQuestion(@Param('sessionCode') sessionCode: string) {
        return this.sessionsService.getCurrentQuestion(sessionCode);
    }

    @Post('sessions/:sessionCode/answer')
    @ApiBearerAuth('team-token')
    @UseGuards(TeamJwtGuard)
    @ApiOperation({
        summary: 'Submit answer (Team access)',
        description: 'Submit an answer to a question in the current session'
    })
    @ApiParam({ name: 'sessionCode', description: 'Session code' })
    @ApiBody({ type: SubmitAnswerDto })
    @ApiResponse({
        status: 200,
        description: 'Answer submitted successfully',
        schema: {
            type: 'object',
            properties: {
                answerId: { type: 'string', example: 'answer-uuid' },
                isCorrect: { type: 'boolean', example: true },
                pointsAwarded: { type: 'number', example: 10 },
                submittedAt: { type: 'string', example: '2025-12-15T10:30:00.000Z' },
                message: { type: 'string', example: 'Correct answer!' }
            }
        }
    })
    @ApiResponse({ status: 404, description: 'Session or question not found' })
    @ApiResponse({ status: 400, description: 'Session is not active or question does not belong to quiz' })
    @ApiResponse({ status: 409, description: 'Answer already submitted' })
    async submitAnswer(
        @Param('sessionCode') sessionCode: string,
        @Req() req: any,
        @Body() dto: SubmitAnswerDto
    ) {
        const teamId = req.user.teamId;
        return this.sessionsService.submitAnswer(teamId, sessionCode, dto);
    }

    @Get('sessions/:sessionCode/teams')
    @ApiOperation({
        summary: 'Get teams in session',
        description: 'Get all teams that have joined this session'
    })
    @ApiParam({ name: 'sessionCode', description: 'Session code' })
    @ApiResponse({
        status: 200,
        description: 'Teams retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                sessionCode: { type: 'string', example: 'ABC123' },
                teams: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', example: 'team-uuid' },
                            name: { type: 'string', example: 'Red Dragons' },
                            isDisqualified: { type: 'boolean', example: false }
                        }
                    }
                },
                totalTeams: { type: 'number', example: 5 }
            }
        }
    })
    @ApiResponse({ status: 404, description: 'Session not found' })
    async getTeams(@Param('sessionCode') sessionCode: string) {
        return this.sessionsService.getTeamsBySession(sessionCode);
    }
}
