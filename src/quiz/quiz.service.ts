import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../infra/prisma/prisma.service';


function randomCode(len = 6) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: len }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}


@Injectable()
export class QuizService {
  constructor(private prisma: PrismaService) { }


  async createQuiz(userId: string, dto: any) {
    return this.prisma.quiz.create({
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
      }
    });
  }


  async createSession(quizId: string) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) throw new NotFoundException('Quiz not found');


    let code = randomCode();
    // çakışma kontrolü
    // eslint-disable-next-line no-constant-condition
    while (await this.prisma.quizSession.findUnique({ where: { sessionCode: code } })) code = randomCode();


    return this.prisma.quizSession.create({ data: { quizId, sessionCode: code } });
  }

  async getQuizQuestions(quizId: string) {
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

    return {
      quizId: quiz.id,
      quizTitle: quiz.title,
      questions: quiz.questions.map(q => ({
        id: q.id,
        index: q.indexInQuiz,
        text: q.text,
        type: q.type,
        choices: q.choices,
        timeLimitSec: q.timeLimitSec,
        points: q.points
      }))
    };
  }

  async getSessionQuestions(sessionCode: string) {
    const session = await this.prisma.quizSession.findUnique({
      where: { sessionCode: sessionCode },
      include: {
        quiz: {
          include: {
            questions: {
              orderBy: { indexInQuiz: 'asc' }
            }
          }
        }
      }
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return {
      sessionId: session.id,
      sessionCode: session.sessionCode,
      quizId: session.quizId,
      quizTitle: session.quiz.title,
      questions: session.quiz.questions.map(q => ({
        id: q.id,
        index: q.indexInQuiz,
        text: q.text,
        type: q.type,
        choices: q.choices,
        timeLimitSec: q.timeLimitSec,
        points: q.points
      }))
    };
  }

  /**
   * Get only the current active question for a session
   * This prevents teams from seeing all questions via browser DevTools
   */
  async getCurrentQuestion(sessionCode: string) {
    const session = await this.prisma.quizSession.findUnique({
      where: { sessionCode },
      include: {
        quiz: {
          include: {
            questions: {
              orderBy: { indexInQuiz: 'asc' }
            }
          }
        }
      }
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const currentIndex = session.currentQuestionIndex || 0;
    const currentQuestion = session.quiz.questions[currentIndex];

    if (!currentQuestion) {
      throw new NotFoundException('No active question found');
    }

    return {
      sessionId: session.id,
      sessionCode: session.sessionCode,
      currentQuestionIndex: currentIndex,
      totalQuestions: session.quiz.questions.length,
      question: {
        id: currentQuestion.id,
        index: currentQuestion.indexInQuiz,
        text: currentQuestion.text,
        type: currentQuestion.type,
        choices: currentQuestion.choices,
        timeLimitSec: currentQuestion.timeLimitSec,
        points: currentQuestion.points
      }
    };
  }
}
