import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { QuizGateway } from './quiz.gateway';
import { WebsocketService } from './websocket.service';
import { WebsocketAuthGuard } from './guards/websocket-auth.guard';
import { WsThrottlerGuard } from './guards/ws-throttler.guard';
import { WsLoggingInterceptor } from './interceptors/ws-logging.interceptor';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
    SessionsModule,
  ],
  providers: [
    QuizGateway,
    WebsocketService,
    WebsocketAuthGuard,
    WsThrottlerGuard,
    WsLoggingInterceptor
  ],
  exports: [QuizGateway]
})
export class RealtimeModule { }