import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guard';

@ApiTags('admin-questions')
@Controller('admin')
@ApiBearerAuth('admin-token')
@UseGuards(AdminJwtGuard)
export class QuestionsController {
    constructor(private readonly questionsService: QuestionsService) { }

    @Post('quizzes/:quizId/questions')
    @ApiOperation({
        summary: 'Add question to quiz',
        description: 'Create a new question for a specific quiz'
    })
    @ApiParam({ name: 'quizId', description: 'Quiz ID' })
    @ApiBody({ type: CreateQuestionDto })
    @ApiResponse({ status: 201, description: 'Question created successfully' })
    @ApiResponse({ status: 404, description: 'Quiz not found' })
    async createQuestion(
        @Param('quizId') quizId: string,
        @Body() dto: CreateQuestionDto
    ) {
        return this.questionsService.createQuestion(quizId, dto);
    }

    @Get('quizzes/:quizId/questions')
    @ApiOperation({
        summary: 'Get all questions for quiz',
        description: 'Retrieve all questions belonging to a specific quiz'
    })
    @ApiParam({ name: 'quizId', description: 'Quiz ID' })
    @ApiResponse({ status: 200, description: 'Questions retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Quiz not found' })
    async getQuestions(@Param('quizId') quizId: string) {
        return this.questionsService.getQuestionsByQuizId(quizId);
    }

    @Put('questions/:questionId')
    @ApiOperation({
        summary: 'Update question',
        description: 'Update an existing question'
    })
    @ApiParam({ name: 'questionId', description: 'Question ID' })
    @ApiBody({ type: UpdateQuestionDto })
    @ApiResponse({ status: 200, description: 'Question updated successfully' })
    @ApiResponse({ status: 404, description: 'Question not found' })
    async updateQuestion(
        @Param('questionId') questionId: string,
        @Body() dto: UpdateQuestionDto
    ) {
        return this.questionsService.updateQuestion(questionId, dto);
    }

    @Delete('questions/:questionId')
    @ApiOperation({
        summary: 'Delete question',
        description: 'Delete a question from a quiz'
    })
    @ApiParam({ name: 'questionId', description: 'Question ID' })
    @ApiResponse({
        status: 200,
        description: 'Question deleted successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Question deleted successfully' }
            }
        }
    })
    @ApiResponse({ status: 404, description: 'Question not found' })
    async deleteQuestion(@Param('questionId') questionId: string) {
        return this.questionsService.deleteQuestion(questionId);
    }
}
