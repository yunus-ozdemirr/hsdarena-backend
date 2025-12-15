import {
  Body,
  Controller,
  Post,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBody, ApiResponse } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../infra/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { TeamService } from './team.service';
import { JoinTeamDto } from './dto/join-team.dto';


@ApiTags('teams')
@Controller('teams')
export class TeamController {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private readonly teamService: TeamService,
  ) { }

  @Post('join')
  @ApiOperation({
    summary: 'Join a quiz session as a team',
    description: 'Creates a new team for a given session code and returns a team-specific JWT token.'
  })
  @ApiBody({
    description: 'Team join request containing session code and team name.',
    type: JoinTeamDto,
    schema: {
      type: 'object',
      properties: {
        sessionCode: { type: 'string', example: 'ABC123' },
        teamName: { type: 'string', example: 'Red Dragons' }
      },
      required: ['sessionCode', 'teamName']
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Team joined successfully. Returns teamId, token, quizId and sessionCode.',
    schema: {
      type: 'object',
      properties: {
        teamId: { type: 'string', example: 'team-uuid-here' },
        teamToken: { type: 'string', example: 'eyJhbGciOiJIUzI1...' },
        quizId: { type: 'string', example: 'quiz-uuid-here' },
        sessionCode: { type: 'string', example: 'ABC123' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Session with the given code was not found.' })
  @ApiResponse({ status: 409, description: 'A team with this name already exists in the session.' })
  async joinSession(@Body() dto: JoinTeamDto) {
    const session = await this.prisma.quizSession.findUnique({
      where: { sessionCode: dto.sessionCode },
    });

    if (!session) {
      throw new NotFoundException(
        `Session with code "${dto.sessionCode}" not found.`,
      );
    }

    let team;
    try {
      team = await this.prisma.team.create({
        data: {
          name: dto.teamName,
          sessionId: session.id,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            `A team with name "${dto.teamName}" has already joined this session.`,
          );
        }
      }
      // For other errors, throw a generic server error
      throw new InternalServerErrorException('Could not create or join the team.');
    }

    if (!team) {
      throw new InternalServerErrorException('Failed to create team, team object is null.');
    }

    const teamToken = this.jwtService.sign({
      teamId: team.id,
      teamName: team.name,
      sessionId: session.id,
      type: 'team',
    });

    return {
      teamId: team.id,
      teamToken,
      quizId: session.quizId,
      sessionCode: session.sessionCode
    };
  }
}