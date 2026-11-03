import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedDemoData(force = false) {
  const existingCount = await prisma.clubSession.count();
  if (existingCount > 0 && !force) {
    console.log(`ℹ️ Database đã có sẵn ${existingCount} phiên điểm danh. Bỏ qua seed tự động.`);
    return { message: 'Database already seeded', seeded: false };
  }

  console.log('🌱 Bắt đầu nạp dữ liệu mẫu (Seeding)...');

  if (force) {
    await prisma.checkInRecord.deleteMany();
    await prisma.clubSession.deleteMany();
  }

  const now = new Date();
  const startTimeSession1 = new Date(now.getTime() - 30 * 60 * 1000); // Bắt đầu trước 30 phút
  const endTimeSession1 = new Date(now.getTime() + 3 * 60 * 60 * 1000); // Còn mở trong 3 tiếng

  // 1. Phiên 1: Đang ACTIVE - để test check-in ngay trên Swagger
  const session1 = await prisma.clubSession.create({
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

  // 2. Phiên 2: Đã kết thúc (CLOSED)
  const pastStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const pastEnd = new Date(pastStart.getTime() + 2 * 60 * 60 * 1000);

  const session2 = await prisma.clubSession.create({
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

  // 3. Thêm các lượt điểm danh sinh viên mẫu
  await prisma.checkInRecord.createMany({
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
      {
        sessionId: session2.id,
        studentId: '21120001',
        studentName: 'Nguyễn Văn An',
        deviceId: 'iPhone 15 Pro (iOS 18)',
        scannedRssi: -65,
        distanceEstimated: 1.78,
        status: 'SUCCESS',
        note: 'Điểm danh BLE hợp lệ buổi workshop trước',
        checkInTime: new Date(pastStart.getTime() + 8 * 60 * 1000),
      },
    ],
  });

  console.log('✅ Đã nạp thành công 2 phiên điểm danh mẫu và 4 lượt điểm danh sinh viên!');
  return {
    message: 'Nạp dữ liệu mẫu thành công!',
    seeded: true,
    activeSessionId: session1.id,
    beaconUuid: session1.beaconUuid,
  };
}

async function main() {
  await seedDemoData(false);
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error('❌ Lỗi khi seed dữ liệu:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
