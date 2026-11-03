import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SessionQueryDto } from './dto/session-query.dto';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSessionDto) {
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    if (endTime <= startTime) {
      throw new BadRequestException('Thời gian kết thúc phải sau thời gian bắt đầu.');
    }

    return this.prisma.clubSession.create({
      data: {
        title: dto.title,
        clubCode: dto.clubCode,
        description: dto.description,
        startTime,
        endTime,
        status: 'ACTIVE',
        beaconUuid: dto.beaconUuid.trim(),
        major: dto.major,
        minor: dto.minor,
        minRssiThreshold: dto.minRssiThreshold ?? -80,
        secretToken: dto.secretToken,
      },
    });
  }

  async findAll(query: SessionQueryDto) {
    const where: any = {};
    if (query.clubCode) {
      where.clubCode = query.clubCode;
    }
    if (query.status) {
      where.status = query.status;
    }

    return this.prisma.clubSession.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { checkIns: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const session = await this.prisma.clubSession.findUnique({
      where: { id },
      include: {
        _count: {
          select: { checkIns: true },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Không tìm thấy phiên điểm danh với ID: ${id}`);
    }

    return session;
  }

  async updateStatus(id: string, status: string) {
    await this.findOne(id);

    return this.prisma.clubSession.update({
      where: { id },
      data: { status },
    });
  }

  async getAttendees(id: string) {
    const session = await this.findOne(id);

    const attendees = await this.prisma.checkInRecord.findMany({
      where: { sessionId: id },
      orderBy: { checkInTime: 'asc' },
    });

    return {
      session: {
        id: session.id,
        title: session.title,
        clubCode: session.clubCode,
        status: session.status,
      },
      totalAttendees: attendees.length,
      attendees,
    };
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.clubSession.delete({
      where: { id },
    });
  }
}

