import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../infra/prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Injectable()
export class QuestionsService {
    constructor(private prisma: PrismaService) { }

    async createQuestion(quizId: string, dto: CreateQuestionDto) {
        // Quiz'in var olduğunu kontrol et
        const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });
        if (!quiz) {
            throw new NotFoundException('Quiz not found');
        }

        // indexInQuiz girilmemişse otomatik hesapla
        let questionIndex = dto.indexInQuiz;
        if (questionIndex === undefined || questionIndex === null) {
            // Mevcut soruların max index'ini bul
            const maxIndexQuestion = await this.prisma.question.findFirst({
                where: { quizId },
                orderBy: { indexInQuiz: 'desc' },
            });
            // Eğer hiç soru yoksa 0, varsa max + 1
            questionIndex = maxIndexQuestion ? maxIndexQuestion.indexInQuiz + 1 : 0;
        }

        // correctAnswer'ı JSON formatına çevir
        let correctAnswerJson: any;
        if (dto.type === 'MCQ') {
            // MCQ için: {id: "choice_2"}
            correctAnswerJson = { id: dto.correctAnswer };
        } else {
            // TF için: {value: true/false}
            const boolValue = dto.correctAnswer === 'true' || dto.correctAnswer === true;
            correctAnswerJson = { value: boolValue };
        }

        // Soru oluştur
        const createData: any = {
            quizId,
            text: dto.text,
            type: dto.type,
            correctAnswer: correctAnswerJson, // JSON object
            timeLimitSec: dto.timeLimitSec,
            points: dto.points,
            indexInQuiz: questionIndex, // Auto-calculated ya da kullanıcının girdiği
        };

        if (dto.choices) {
            createData.choices = dto.choices;
        }

        const question = await this.prisma.question.create({
            data: createData,
        });

        return question;
    }

    async getQuestionsByQuizId(quizId: string) {
        // Quiz'in var olduğunu kontrol et
        const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });
        if (!quiz) {
            throw new NotFoundException('Quiz not found');
        }

        // Soruları getir
        const questions = await this.prisma.question.findMany({
            where: { quizId },
            orderBy: { indexInQuiz: 'asc' },
        });

        return questions;
    }

    async updateQuestion(questionId: string, dto: UpdateQuestionDto) {
        // Sorunun var olduğunu kontrol et
        const question = await this.prisma.question.findUnique({
            where: { id: questionId },
        });

        if (!question) {
            throw new NotFoundException('Question not found');
        }

        // Update data object'i oluştur
        const updateData: any = {};

        if (dto.text !== undefined) updateData.text = dto.text;
        if (dto.type !== undefined) updateData.type = dto.type;
        if (dto.choices !== undefined) updateData.choices = dto.choices;
        if (dto.correctAnswer !== undefined) updateData.correctAnswer = dto.correctAnswer;
        if (dto.timeLimitSec !== undefined) updateData.timeLimitSec = dto.timeLimitSec;
        if (dto.points !== undefined) updateData.points = dto.points;
        if (dto.indexInQuiz !== undefined) updateData.indexInQuiz = dto.indexInQuiz;

        // Soruyu güncelle
        const updatedQuestion = await this.prisma.question.update({
            where: { id: questionId },
            data: updateData,
        });

        return updatedQuestion;
    }

    async deleteQuestion(questionId: string) {
        // Sorunun var olduğunu kontrol et
        const question = await this.prisma.question.findUnique({
            where: { id: questionId },
        });

        if (!question) {
            throw new NotFoundException('Question not found');
        }

        // Soruyu sil
        await this.prisma.question.delete({ where: { id: questionId } });

        return { message: 'Question deleted successfully' };
    }
}
