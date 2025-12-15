import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitAnswerDto {
    @ApiProperty({
        description: 'Question ID',
        example: 'question-uuid'
    })
    @IsNotEmpty()
    @IsString()
    questionId: string;

    @ApiProperty({
        description: 'Answer payload (choice ID for MCQ, boolean for TF)',
        example: 'choice_2'
    })
    @IsNotEmpty()
    answerPayload: any;
}
