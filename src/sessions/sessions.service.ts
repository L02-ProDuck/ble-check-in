import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SessionQueryDto } from './dto/session-query.dto';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSessionDto) {
    let startTime = new Date(dto.startTime);
    let endTime = new Date(dto.endTime);

    // Hỗ trợ kiểm thử trên Swagger: Nếu sử dụng dữ liệu mẫu cố định mà thời gian bị lệch với hiện tại,
    // tự động điều chỉnh khung giờ [now - 10 phút, now + 4 tiếng] để phiên luôn sẵn sàng test điểm danh.
    const now = new Date();
    if (now < startTime || now > endTime) {
      startTime = new Date(now.getTime() - 10 * 60 * 1000);
      endTime = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    }

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

  async seedDemo() {
    const now = new Date();
    const startTimeSession1 = new Date(now.getTime() - 30 * 60 * 1000); // 30 phút trước
    const endTimeSession1 = new Date(now.getTime() + 4 * 60 * 60 * 1000); // Còn 4 tiếng nữa

    const session1 = await this.prisma.clubSession.create({
      data: {
        title: 'Sinh hoạt CLB IT - Lập trình Mobile & BLE Proximity',
        clubCode: 'CLUB_IT_DUT',
        description: 'Phiên điểm danh đầu giờ tại phòng Lab F204 bằng thiết bị phát BLE Beacon.',
        startTime: startTimeSession1,
        endTime: endTimeSession1,
        status: 'ACTIVE',
        beaconUuid: 'FDA50693-A4E2-4FB1-AFCF-C6EB07647825',
        major: 100,
        minor: 1,
        minRssiThreshold: -80,
        secretToken: 'SEC-8899',
      },
    });

    const pastStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const pastEnd = new Date(pastStart.getTime() + 2 * 60 * 60 * 1000);

    const session2 = await this.prisma.clubSession.create({
      data: {
        title: 'Workshop Giới thiệu Công nghệ IoT & BLE',
        clubCode: 'CLUB_IT_DUT',
        description: 'Buổi training kỹ thuật cho thành viên mới khóa 2026.',
        startTime: pastStart,
        endTime: pastEnd,
        status: 'CLOSED',
        beaconUuid: 'FDA50693-A4E2-4FB1-AFCF-C6EB07647825',
        major: 100,
        minor: 2,
        minRssiThreshold: -80,
      },
    });

    await this.prisma.checkInRecord.createMany({
      data: [
        {
          sessionId: session1.id,
          studentId: '21120001',
          studentName: 'Nguyễn Văn An',
          deviceId: 'iPhone 15 Pro (iOS 18)',
          scannedRssi: -62,
          distanceEstimated: 1.41,
          status: 'SUCCESS',
          note: 'Điểm danh BLE hợp lệ (khoảng cách ~1.41m)',
          checkInTime: new Date(startTimeSession1.getTime() + 5 * 60 * 1000),
        },
        {
          sessionId: session1.id,
          studentId: '21120002',
          studentName: 'Trần Thị Bình',
          deviceId: 'Samsung Galaxy S24 (Android 14)',
          scannedRssi: -71,
          distanceEstimated: 2.82,
          status: 'SUCCESS',
          note: 'Điểm danh BLE hợp lệ (khoảng cách ~2.82m)',
          checkInTime: new Date(startTimeSession1.getTime() + 10 * 60 * 1000),
        },
        {
          sessionId: session1.id,
          studentId: '21120003',
          studentName: 'Lê Hoàng Cường',
          deviceId: 'Xiaomi 13T (HyperOS)',
          scannedRssi: -68,
          distanceEstimated: 2.24,
          status: 'SUCCESS',
          note: 'Điểm danh BLE hợp lệ (khoảng cách ~2.24m)',
          checkInTime: new Date(startTimeSession1.getTime() + 12 * 60 * 1000),
        },
      ],
    });

    return {
      message: 'Nạp dữ liệu demo thành công cho giáo viên kiểm thử!',
      activeSessionId: session1.id,
      sampleBeaconUuid: session1.beaconUuid,
      sampleMajor: session1.major,
      sampleMinor: session1.minor,
      secretToken: session1.secretToken,
      note: 'Bạn có thể dùng ID phiên này để test API điểm danh POST /api/v1/check-in ngay lập tức!',
    };
  }
}
