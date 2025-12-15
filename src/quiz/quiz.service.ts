import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../infra/prisma/prisma.service';

@Injectable()
export class QuizService {
  constructor(private prisma: PrismaService) { }

  async createQuiz(userId: string, dto: any) {
    const quiz = await this.prisma.quiz.create({
      data: {
        title: dto.title,
        createdBy: userId,
        settings: dto.settings || {},
        questions: {
          create: dto.questions.map((q: any) => ({
            indexInQuiz: q.index,
            text: q.text,
            type: q.type,
            choices: q.choices || [],
            correctAnswer: q.correctAnswer || {},
            timeLimitSec: q.timeLimitSec,
            points: q.points
          }))
        }
      },
      include: {
        questions: true
      }
    });

    return {
      id: quiz.id,
      title: quiz.title,
      createdBy: quiz.createdBy,
      createdAt: quiz.createdAt,
      questionsCount: quiz.questions.length
    };
  }

  async getAllQuizzes(userId: string) {
    const quizzes = await this.prisma.quiz.findMany({
      where: { createdBy: userId },
      include: {
        _count: {
          select: { questions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return quizzes.map(quiz => ({
      id: quiz.id,
      title: quiz.title,
      visibility: quiz.visibility,
      createdAt: quiz.createdAt,
      questionsCount: quiz._count.questions
    }));
  }

  async getQuizById(quizId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { indexInQuiz: 'asc' }
        }
      }
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    return quiz;
  }

  async updateQuiz(quizId: string, dto: { title?: string; settings?: any }) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId }
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    const updatedQuiz = await this.prisma.quiz.update({
      where: { id: quizId },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.settings && { settings: dto.settings })
      }
    });

    return updatedQuiz;
  }

  async deleteQuiz(quizId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: true,
        sessions: {
          include: {
            teams: {
              include: {
                answers: true
              }
            }
          }
        }
      }
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    // Manuel cascade delete - ilişkili tüm verileri sil
    // 1. Session'lara bağlı answer'ları sil
    for (const session of quiz.sessions) {
      for (const team of session.teams) {
        await this.prisma.answer.deleteMany({
          where: { teamId: team.id }
        });
      }

      // 2. Session'a bağlı team'leri sil
      await this.prisma.team.deleteMany({
        where: { sessionId: session.id }
      });
    }

    // 3. Session'ları sil
    await this.prisma.quizSession.deleteMany({
      where: { quizId }
    });

    // 4. Question'ları sil
    await this.prisma.question.deleteMany({
      where: { quizId }
    });

    // 5. Quiz'i sil
    await this.prisma.quiz.delete({
      where: { id: quizId }
    });

    return {
      message: 'Quiz deleted successfully',
      deletedSessions: quiz.sessions.length,
      deletedQuestions: quiz.questions.length
    };
  }
}
