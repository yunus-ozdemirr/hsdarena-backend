import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { UseGuards, UseInterceptors } from '@nestjs/common';
import { WebsocketAuthGuard } from './guards/websocket-auth.guard';
import { WsThrottlerGuard } from './guards/ws-throttler.guard';
import { WsLoggingInterceptor } from './interceptors/ws-logging.interceptor';
import { WebsocketService } from './websocket.service';
import { SessionsService } from '../sessions/sessions.service';
import { AuthenticatedSocket, JoinSessionPayload } from './types/websocket.types';
import { JwtService } from '@nestjs/jwt';
import { QuestionDto, LeaderboardEntryDto } from './dto/quiz-events.dto';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
  },
  namespace: '/realtime',
})
export class QuizGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(QuizGateway.name);
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly websocketService: WebsocketService,
    private readonly jwtService: JwtService,
    private readonly sessionsService: SessionsService,
  ) { }

  async handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.websocketService.removeClientFromRoom(client);
  }

  @UseGuards(WebsocketAuthGuard, WsThrottlerGuard)
  @UseInterceptors(WsLoggingInterceptor)
  @SubscribeMessage('join_session')
  async handleJoinSession(client: AuthenticatedSocket, payload: JoinSessionPayload) {
    try {
      if (!payload.sessionCode) {
        throw new WsException('Session code is required');
      }

      this.websocketService.addClientToRoom(payload.sessionCode, client);

      client.emit('join_success', {
        sessionCode: payload.sessionCode,
      });
    } catch (error) {
      client.emit('error', {
        message: error instanceof Error ? error.message : 'Failed to join session',
      });
    }
  }

  @UseGuards(WebsocketAuthGuard, WsThrottlerGuard)
  @UseInterceptors(WsLoggingInterceptor)
  @SubscribeMessage('question:get-current')
  async handleGetCurrentQuestion(client: AuthenticatedSocket, payload: { sessionCode: string }) {
    try {
      if (!payload.sessionCode) {
        throw new WsException('Session code is required');
      }

      // SessionsService'den mevcut soruyu al
      const currentQuestion = await this.sessionsService.getCurrentQuestion(payload.sessionCode);

      // Client'a geri gönder
      client.emit('question:current', {
        sessionCode: payload.sessionCode,
        question: currentQuestion,
      });
    } catch (error) {
      client.emit('error', {
        message: error instanceof Error ? error.message : 'Failed to get current question',
      });
    }
  }

  // Session events
  broadcastSessionStarted(sessionCode: string) {
    this.websocketService.broadcastToRoom(sessionCode, 'session:started', {
      sessionCode,
      timestamp: new Date().toISOString()
    });
    this.logger.debug(`Session started: ${sessionCode}`);
  }

  broadcastSessionEnded(sessionCode: string) {
    this.websocketService.broadcastToRoom(sessionCode, 'session:ended', {
      sessionCode,
      timestamp: new Date().toISOString()
    });
    this.logger.debug(`Session ended: ${sessionCode}`);
  }

  // Question events
  broadcastQuestionStarted(sessionCode: string, questionIndex: number, question: QuestionDto) {
    try {
      this.websocketService.broadcastToRoom(sessionCode, 'question:started', {
        sessionCode,
        questionIndex,
        question: {
          id: question.id,
          text: question.text,
          type: question.type,
          choices: question.choices,
          timeLimitSec: question.timeLimitSec,
          points: question.points,
        }
      });
      this.logger.debug(`Question started for session ${sessionCode}: ${question.id}`);
    } catch (error) {
      this.logger.error(`Failed to broadcast question start: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined);
      throw new WsException('Failed to broadcast question');
    }
  }

  broadcastQuestionTimeWarning(sessionCode: string, questionIndex: number, remainingSeconds: number) {
    this.websocketService.broadcastToRoom(sessionCode, 'question:time-warning', {
      sessionCode,
      questionIndex,
      remainingSeconds
    });
    this.logger.debug(`Time warning for session ${sessionCode}, question ${questionIndex}: ${remainingSeconds}s remaining`);
  }

  broadcastQuestionEnded(sessionCode: string, questionIndex: number) {
    this.websocketService.broadcastToRoom(sessionCode, 'question:ended', {
      sessionCode,
      questionIndex,
      timestamp: new Date().toISOString()
    });
    this.logger.debug(`Question ended for session ${sessionCode}, index ${questionIndex}`);
  }

  // Answer events
  broadcastAnswerSubmitted(sessionCode: string, teamId: string) {
    this.websocketService.broadcastToRoom(sessionCode, 'answer:submitted', {
      sessionCode,
      teamId,
      timestamp: new Date().toISOString()
    });
  }

  broadcastAnswerStatsUpdated(sessionCode: string, stats: { totalAnswers: number; correctAnswers: number }) {
    this.websocketService.broadcastToRoom(sessionCode, 'answer:stats-updated', {
      sessionCode,
      stats
    });
  }

  // Scoreboard events
  broadcastScoreboardUpdated(sessionCode: string, leaderboard: LeaderboardEntryDto[]) {
    this.websocketService.broadcastToRoom(sessionCode, 'scoreboard:updated', {
      sessionCode,
      leaderboard: leaderboard.map((team) => ({
        teamName: team.teamName,
        score: team.score,
        rank: team.rank,
      })),
      timestamp: new Date().toISOString()
    });
    this.logger.debug(`Scoreboard updated for session ${sessionCode}`);
  }

  // Admin control events (Client → Server)
  @SubscribeMessage('admin:next-question')
  @UseGuards(WebsocketAuthGuard)
  async handleAdminNextQuestion(client: AuthenticatedSocket, payload: { sessionCode: string }) {
    try {
      if (!payload.sessionCode) {
        throw new WsException('Session code is required');
      }

      this.logger.log(`Admin triggering next question for session ${payload.sessionCode}`);

      // Session service'i çağırarak sonraki soruya geç
      const result = await this.sessionsService.nextQuestion(payload.sessionCode);

      if (result.finished) {
        // Tüm sorular bitti, session'ı sonlandır
        this.broadcastSessionEnded(payload.sessionCode);

        client.emit('admin:next-question:ack', {
          sessionCode: payload.sessionCode,
          success: true,
          finished: true,
          message: result.message,
        });
      } else {
        //Yeni soruyu broadcast et
        if (!result.question || result.currentQuestionIndex === undefined) {
          throw new WsException('Invalid question data');
        }

        this.broadcastQuestionStarted(
          payload.sessionCode,
          result.currentQuestionIndex,
          {
            id: result.question.id,
            text: result.question.text,
            type: result.question.type as any, // Prisma type'dan QuestionDto type'a cast
            choices: result.question.choices as any,
            points: result.question.points,
            timeLimitSec: result.question.timeLimitSec,
          }
        );

        client.emit('admin:next-question:ack', {
          sessionCode: payload.sessionCode,
          success: true,
          finished: false,
          currentQuestionIndex: result.currentQuestionIndex,
          totalQuestions: result.totalQuestions,
        });
      }
    } catch (error) {
      client.emit('error', {
        message: error instanceof Error ? error.message : 'Failed to advance question',
      });
    }
  }

  @SubscribeMessage('admin:end-session')
  @UseGuards(WebsocketAuthGuard)
  async handleAdminEndSession(client: AuthenticatedSocket, payload: { sessionCode: string }) {
    try {
      if (!payload.sessionCode) {
        throw new WsException('Session code is required');
      }

      this.logger.log(`Admin ending session ${payload.sessionCode}`);

      // Burada session service'i çağırarak session bitirilebilir
      // Şimdilik sadece event'i broadcast ediyoruz

      this.broadcastSessionEnded(payload.sessionCode);

      client.emit('admin:end-session:ack', {
        sessionCode: payload.sessionCode,
        success: true
      });
    } catch (error) {
      client.emit('error', {
        message: error instanceof Error ? error.message : 'Failed to end session',
      });
    }
  }

  private extractToken(client: AuthenticatedSocket): string | undefined {
    return client.handshake.auth.token ||
      client.handshake.headers.authorization?.replace('Bearer ', '');
  }
}