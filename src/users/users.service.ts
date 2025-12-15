import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../infra/prisma/prisma.service';
import * as argon from 'argon2';
import { UpdateEmailDto } from './dto/update-email.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async updateEmail(userId: string, dto: UpdateEmailDto) {
        // Kullanıcıyı bul
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Mevcut şifreyi doğrula
        const isPasswordValid = await argon.verify(user.passwordHash, dto.currentPassword);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid password');
        }

        // Yeni email'in kullanılıp kullanılmadığını kontrol et
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.newEmail }
        });
        if (existingUser) {
            throw new ConflictException('Email already in use');
        }

        // Email'i güncelle
        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: { email: dto.newEmail },
            select: { id: true, email: true, createdAt: true },
        });

        return { message: 'Email updated successfully', user: updatedUser };
    }

    async updatePassword(userId: string, dto: UpdatePasswordDto) {
        // Kullanıcıyı bul
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Mevcut şifreyi doğrula
        const isPasswordValid = await argon.verify(user.passwordHash, dto.currentPassword);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Current password is incorrect');
        }

        // Yeni şifreyi hash'le
        const newPasswordHash = await argon.hash(dto.newPassword);

        // Şifreyi güncelle
        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash: newPasswordHash },
        });

        return { message: 'Password updated successfully' };
    }

    async deleteAccount(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                quizzes: {
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
                }
            }
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Manuel cascade delete - tüm ilişkili verileri sil
        for (const quiz of user.quizzes) {
            // Session'lara bağlı answer ve team'leri sil
            for (const session of quiz.sessions) {
                for (const team of session.teams) {
                    await this.prisma.answer.deleteMany({
                        where: { teamId: team.id }
                    });
                }
                await this.prisma.team.deleteMany({
                    where: { sessionId: session.id }
                });
            }

            // Session'ları sil
            await this.prisma.quizSession.deleteMany({
                where: { quizId: quiz.id }
            });

            // Question'ları sil
            await this.prisma.question.deleteMany({
                where: { quizId: quiz.id }
            });
        }

        // Quiz'leri sil
        await this.prisma.quiz.deleteMany({
            where: { createdBy: userId }
        });

        // User'ı sil
        await this.prisma.user.delete({
            where: { id: userId }
        });

        return { message: 'Account deleted successfully' };
    }
}
