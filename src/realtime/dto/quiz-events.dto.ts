import { IsString, IsNumber, IsEnum, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export enum QuestionType {
  MCQ = 'MCQ',
  TF = 'TF'
}

export class QuestionChoiceDto {
  @IsString()
  id: string;

  @IsString()
  text: string;
}

export class QuestionDto {
  @IsString()
  id: string;

  @IsString()
  text: string;

  @IsEnum(QuestionType)
  type: QuestionType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionChoiceDto)
  @IsOptional()
  choices?: QuestionChoiceDto[];

  @IsNumber()
  timeLimitSec: number;

  @IsNumber()
  points: number;
}

export class LeaderboardEntryDto {
  @IsString()
  teamName: string;

  @IsNumber()
  score: number;

  @IsNumber()
  rank: number;
}

export class QuizResultsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LeaderboardEntryDto)
  leaderboard: LeaderboardEntryDto[];

  @IsNumber()
  totalQuestions: number;

  @IsNumber()
  duration: number;
}