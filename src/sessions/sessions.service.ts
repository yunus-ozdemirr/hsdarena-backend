import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../infra/prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

@Injectable()
export class SessionsService {
    constructor(private prisma: PrismaService) { }

    // Session code generator
    private generateSessionCode(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    async createSession(quizId: string, dto: CreateSessionDto) {
        // Quiz'in var olduğunu ve sorularının olduğunu kontrol et
        const quiz = await this.prisma.quiz.findUnique({
            where: { id: quizId },
            include: { questions: true },
        });

        if (!quiz) {
            throw new NotFoundException('Quiz not found');
        }

        if (quiz.questions.length === 0) {
            throw new BadRequestException('Quiz has no questions');
        }

        // Benzersiz session code oluştur
        let sessionCode = this.generateSessionCode();
        let attempts = 0;
        while (attempts < 10) {
            const existing = await this.prisma.quizSession.findUnique({
                where: { sessionCode },
            });
            if (!existing) break;
            sessionCode = this.generateSessionCode();
            attempts++;
        }

        // Session oluştur
        const session = await this.prisma.quizSession.create({
            data: {
                quizId,
                sessionCode,
                status: 'CREATED',
                currentQuestionIndex: 0,
                startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
            },
        });

        return {
            sessionId: session.id,
            sessionCode: session.sessionCode,
            quizId: session.quizId,
            status: session.status,
        };
    }

    async getSessionByCode(sessionCode: string) {
        const session = await this.prisma.quizSession.findUnique({
            where: { sessionCode },
            include: {
                quiz: {
                    include: {
                        questions: {
                            orderBy: { indexInQuiz: 'asc' },
                        },
                    },
                },
                teams: true,
            },
        });

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        return session;
    }

    async startSession(sessionCode: string) {
        const session = await this.prisma.quizSession.findUnique({
            where: { sessionCode },
        });

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        if (session.status === 'ACTIVE') {
            return {
                message: 'Session is already active',
                sessionCode: session.sessionCode,
                status: session.status,
            };
        }

        const updatedSession = await this.prisma.quizSession.update({
            where: { sessionCode },
            data: { status: 'ACTIVE' },
        });

        return {
            message: 'Session started successfully',
            sessionCode: updatedSession.sessionCode,
            status: updatedSession.status,
        };
    }

    async getSessionScoreboard(sessionCode: string) {
        const session = await this.prisma.quizSession.findUnique({
            where: { sessionCode },
            include: {
                teams: {
                    include: {
                        answers: true,
                    },
                },
            },
        });

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        // Takım skorlarını hesapla
        const leaderboard = session.teams.map((team) => {
            const totalScore = team.answers.reduce((sum, answer) => sum + answer.pointsAwarded, 0);
            return {
                teamId: team.id,
                teamName: team.name,
                score: totalScore,
            };
        });

        // Skora göre sırala
        leaderboard.sort((a, b) => b.score - a.score);

        return {
            sessionCode: session.sessionCode,
            leaderboard,
        };
    }

    async getQuizForSession(sessionCode: string) {
        const session = await this.prisma.quizSession.findUnique({
            where: { sessionCode },
            include: {
                quiz: {
                    select: {
                        id: true,
                        title: true,
                        settings: true,
                    },
                },
            },
        });

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        return session.quiz;
    }

    async getCurrentQuestion(sessionCode: string) {
        const session = await this.prisma.quizSession.findUnique({
            where: { sessionCode },
            include: {
                quiz: {
                    include: {
                        questions: {
                            orderBy: { indexInQuiz: 'asc' },
                        },
                    },
                },
            },
        });

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        if (session.currentQuestionIndex === null) {
            throw new BadRequestException('Session has not started');
        }

        const currentQuestion = session.quiz.questions[session.currentQuestionIndex];

        if (!currentQuestion) {
            throw new NotFoundException('No current question');
        }

        // Doğru cevabı gizle (sadece soru bilgilerini dön)
        return {
            id: currentQuestion.id,
            text: currentQuestion.text,
            type: currentQuestion.type,
            choices: currentQuestion.choices,
            timeLimitSec: currentQuestion.timeLimitSec,
            points: currentQuestion.points,
            indexInQuiz: currentQuestion.indexInQuiz,
        };
    }

    async nextQuestion(sessionCode: string) {
        const session = await this.prisma.quizSession.findUnique({
            where: { sessionCode },
            include: {
                quiz: {
                    include: {
                        questions: {
                            orderBy: { indexInQuiz: 'asc' },
                        },
                    },
                },
            },
        });

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        if (session.currentQuestionIndex === null) {
            throw new BadRequestException('Session has not started');
        }

        const nextIndex = session.currentQuestionIndex + 1;

        // Tüm sorular bitti mi kontrol et
        if (nextIndex >= session.quiz.questions.length) {
            // Session'ı sonlandır
            await this.prisma.quizSession.update({
                where: { id: session.id },
                data: {
                    status: 'FINISHED',
                },
            });

            return {
                sessionCode: session.sessionCode,
                finished: true,
                message: 'All questions completed',
            };
        }

        // Sıradaki soruya geç
        const updatedSession = await this.prisma.quizSession.update({
            where: { id: session.id },
            data: { currentQuestionIndex: nextIndex },
            include: {
                quiz: {
                    include: {
                        questions: {
                            orderBy: { indexInQuiz: 'asc' },
                        },
                    },
                },
            },
        });

        const currentQuestion = updatedSession.quiz.questions[nextIndex];

        return {
            sessionCode: updatedSession.sessionCode,
            finished: false,
            currentQuestionIndex: nextIndex,
            totalQuestions: updatedSession.quiz.questions.length,
            question: {
                id: currentQuestion.id,
                text: currentQuestion.text,
                type: currentQuestion.type,
                choices: currentQuestion.choices,
                timeLimitSec: currentQuestion.timeLimitSec,
                points: currentQuestion.points,
                indexInQuiz: currentQuestion.indexInQuiz,
            },
        };
    }

    async submitAnswer(teamId: string, sessionCode: string, dto: SubmitAnswerDto) {
        // Session'ı ve soruyu kontrol et
        const session = await this.prisma.quizSession.findUnique({
            where: { sessionCode },
            include: {
                quiz: {
                    include: {
                        questions: true,
                    },
                },
            },
        });

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        // Session CREATED ise otomatik ACTIVE yap (ilk cevap geldiğinde başlat)
        if (session.status === 'CREATED') {
            await this.prisma.quizSession.update({
                where: { id: session.id },
                data: { status: 'ACTIVE' }
            });
            session.status = 'ACTIVE'; // Local object'i de güncelle
        }

        // Session bitmişse cevap kabul etme
        if (session.status === 'FINISHED') {
            throw new BadRequestException('Session has already ended');
        }

        // Session ACTIVE değilse hata ver (ama yukarıda CREATED'ı ACTIVE yaptık)
        if (session.status !== 'ACTIVE') {
            throw new BadRequestException('Session is not active');
        }

        const question = await this.prisma.question.findUnique({
            where: { id: dto.questionId },
        });

        if (!question) {
            throw new NotFoundException('Question not found');
        }

        if (question.quizId !== session.quizId) {
            throw new BadRequestException('Question does not belong to this quiz');
        }

        // Takımın daha önce cevap verip vermediğini kontrol et
        const existingAnswer = await this.prisma.answer.findUnique({
            where: {
                sessionId_questionId_teamId: {
                    sessionId: session.id,
                    questionId: dto.questionId,
                    teamId: teamId,
                },
            },
        });

        if (existingAnswer) {
            throw new ConflictException('Answer already submitted for this question');
        }

        // Cevabı değerlendir
        let isCorrect = false;
        const correctAnswer = question.correctAnswer as any;

        if (question.type === 'MCQ') {
            isCorrect = dto.answerPayload === correctAnswer.id || dto.answerPayload === correctAnswer;
        } else if (question.type === 'TF') {
            isCorrect = dto.answerPayload === correctAnswer.value || dto.answerPayload === correctAnswer;
        }

        const pointsAwarded = isCorrect ? question.points : 0;

        // Cevabı kaydet
        const answer = await this.prisma.answer.create({
            data: {
                sessionId: session.id,
                questionId: dto.questionId,
                teamId: teamId,
                answerPayload: dto.answerPayload,
                isCorrect,
                pointsAwarded,
            },
        });

        return {
            answerId: answer.id,
            isCorrect,
            pointsAwarded,
            submittedAt: answer.answeredAt,
            message: isCorrect ? 'Correct answer!' : 'Incorrect answer',
        };
    }

    async getTeamsBySession(sessionCode: string) {
        const session = await this.prisma.quizSession.findUnique({
            where: { sessionCode },
            include: {
                teams: {
                    select: {
                        id: true,
                        name: true,
                        disqualified: true, // Prisma schema'da disqualified
                    },
                },
            },
        });

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        return {
            sessionCode: session.sessionCode,
            teams: session.teams,
            totalTeams: session.teams.length,
        };
    }
}
