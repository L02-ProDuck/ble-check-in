import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckInRequestDto } from './dto/check-in-request.dto';

@Injectable()
export class CheckInService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tính khoảng cách ước lượng dựa trên RSSI và TxPower (BLE Log-distance path loss model)
   * n = 2.0 (môi trường trong phòng, không gian tự do)
   */
  private calculateDistance(rssi: number, txPower: number = -59): number {
    if (rssi === 0) return -1.0;
    const ratio = (txPower - rssi) / (10 * 2.0);
    const distance = Math.pow(10, ratio);
    return Math.round(distance * 100) / 100; // Làm tròn 2 chữ số thập phân (mét)
  }

  async processCheckIn(dto: CheckInRequestDto) {
    const { sessionId, studentId, studentName, deviceId, beaconData, secretToken } = dto;

    // 1. Kiểm tra phiên điểm danh có tồn tại không
    const session = await this.prisma.clubSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Phiên điểm danh với ID ${sessionId} không tồn tại.`);
    }

    // 2. Kiểm tra trạng thái phiên
    if (session.status !== 'ACTIVE') {
      throw new BadRequestException(
        `Phiên điểm danh hiện đang ở trạng thái "${session.status}". Chỉ có thể điểm danh khi phiên ACTIVE.`,
      );
    }

    // 3. Kiểm tra khung giờ diễn ra phiên
    const now = new Date();
    if (now < session.startTime) {
      throw new BadRequestException(
        `Phiên điểm danh chưa bắt đầu. Thời gian mở: ${session.startTime.toISOString()}`,
      );
    }
    if (now > session.endTime) {
      throw new BadRequestException(
        `Phiên điểm danh đã kết thúc lúc: ${session.endTime.toISOString()}`,
      );
    }

    // 4. Kiểm tra mã PIN bảo mật nếu phiên có cài đặt
    if (session.secretToken && session.secretToken.trim() !== '') {
      if (!secretToken || secretToken.trim() !== session.secretToken.trim()) {
        throw new BadRequestException(
          'Mã PIN bảo mật của phiên không chính xác hoặc chưa được cung cấp.',
        );
      }
    }

    // 5. Xác thực thông số BLE Beacon (UUID, Major, Minor)
    const normalizedBeaconUuid = beaconData.uuid.toLowerCase().replace(/-/g, '');
    const sessionBeaconUuid = session.beaconUuid.toLowerCase().replace(/-/g, '');

    if (normalizedBeaconUuid !== sessionBeaconUuid) {
      throw new BadRequestException(
        `BLE UUID không khớp với thiết bị phát của phiên (Nhận: ${beaconData.uuid}, Yêu cầu: ${session.beaconUuid}).`,
      );
    }

    if (beaconData.major !== session.major || beaconData.minor !== session.minor) {
      throw new BadRequestException(
        `Thông số Major/Minor không khớp (Nhận: ${beaconData.major}/${beaconData.minor}, Yêu cầu: ${session.major}/${session.minor}).`,
      );
    }

    // 6. Kiểm tra khoảng cách gần (Proximity check bằng RSSI)
    if (beaconData.rssi < session.minRssiThreshold) {
      throw new BadRequestException(
        `Tín hiệu BLE quá yếu (${beaconData.rssi} dBm < ngưỡng tối thiểu ${session.minRssiThreshold} dBm). Bạn đang ở quá xa thiết bị điểm danh của CLB!`,
      );
    }

    // 7. Kiểm tra trùng lặp sinh viên đã điểm danh chưa
    const existingCheckIn = await this.prisma.checkInRecord.findUnique({
      where: {
        sessionId_studentId: {
          sessionId,
          studentId: studentId.trim(),
        },
      },
    });

    if (existingCheckIn) {
      throw new ConflictException(
        `Sinh viên [${studentId}] - ${existingCheckIn.studentName} đã điểm danh phiên này vào lúc ${existingCheckIn.checkInTime.toISOString()}.`,
      );
    }

    // 8. Tính khoảng cách ước lượng
    const distanceEstimated = this.calculateDistance(beaconData.rssi, beaconData.txPower ?? -59);

    // 9. Lưu bản ghi điểm danh
    const checkInRecord = await this.prisma.checkInRecord.create({
      data: {
        sessionId,
        studentId: studentId.trim(),
        studentName: studentName.trim(),
        deviceId,
        scannedRssi: beaconData.rssi,
        distanceEstimated,
        status: 'SUCCESS',
        note: `Điểm danh BLE hợp lệ lúc ${now.toLocaleTimeString('vi-VN')} (khoảng cách ~${distanceEstimated}m)`,
      },
    });

    return {
      message: 'Điểm danh gần bằng Bluetooth thành công!',
      data: {
        recordId: checkInRecord.id,
        studentId: checkInRecord.studentId,
        studentName: checkInRecord.studentName,
        checkInTime: checkInRecord.checkInTime,
        status: checkInRecord.status,
        sessionTitle: session.title,
        clubCode: session.clubCode,
        bleVerification: {
          rssi: checkInRecord.scannedRssi,
          distanceEstimatedMeters: distanceEstimated,
          minRssiThreshold: session.minRssiThreshold,
          proximityStatus: 'VERIFIED_NEARBY',
        },
      },
    };
  }

  async getHistoryByStudent(studentId: string) {
    const records = await this.prisma.checkInRecord.findMany({
      where: { studentId: studentId.trim() },
      include: {
        session: {
          select: {
            title: true,
            clubCode: true,
            startTime: true,
            endTime: true,
            status: true,
          },
        },
      },
      orderBy: { checkInTime: 'desc' },
    });

    return {
      studentId: studentId.trim(),
      totalCheckIns: records.length,
      history: records,
    };
  }

  async getRecordById(id: string) {
    const record = await this.prisma.checkInRecord.findUnique({
      where: { id },
      include: {
        session: true,
      },
    });

    if (!record) {
      throw new NotFoundException(`Không tìm thấy bản ghi điểm danh với ID ${id}`);
    }

    return record;
  }

  async deleteRecord(id: string) {
    await this.getRecordById(id);
    return this.prisma.checkInRecord.delete({
      where: { id },
    });
  }
}

