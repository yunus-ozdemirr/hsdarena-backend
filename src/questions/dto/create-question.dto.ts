import { IsArray, IsInt, IsOptional, IsString, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class ChoiceDto {
    @ApiProperty({
        description: 'Choice ID',
        example: 'choice_1',
        type: 'string'
    })
    @IsString()
    id: string;

    @ApiProperty({
        description: 'Choice text',
        example: 'Option A',
        type: 'string'
    })
    @IsString()
    text: string;
}

export class CreateQuestionDto {
    @ApiProperty({
        description: 'Question text',
        example: 'What is the capital of Turkey?',
        type: 'string'
    })
    @IsString()
    text: string;

    @ApiProperty({
        description: 'Question type',
        example: 'MCQ',
        enum: ['MCQ', 'TF'],
        type: 'string'
    })
    @IsEnum(['MCQ', 'TF'] as any)
    type: 'MCQ' | 'TF';

    @ApiProperty({
        description: 'Answer choices for MCQ questions',
        example: [
            { id: 'choice_1', text: 'Istanbul' },
            { id: 'choice_2', text: 'Ankara' },
            { id: 'choice_3', text: 'Izmir' },
            { id: 'choice_4', text: 'Bursa' }
        ],
        type: [ChoiceDto],
        required: false
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ChoiceDto)
    choices?: ChoiceDto[];

    @ApiProperty({
        description: 'Correct answer',
        example: 'choice_2',
        type: 'string',
        required: false
    })
    @IsOptional()
    correctAnswer?: any;

    @ApiProperty({
        description: 'Time limit in seconds',
        example: 30,
        type: 'number'
    })
    @IsInt()
    timeLimitSec: number;

    @ApiProperty({
        description: 'Points for this question',
        example: 10,
        type: 'number'
    })
    @IsInt()
    points: number;

    @ApiProperty({
        description: 'Question index in the quiz (optional, auto-calculated if not provided)',
        example: 1,
        type: 'number',
        required: false
    })
    @IsOptional()
    @IsInt()
    indexInQuiz?: number;
}
