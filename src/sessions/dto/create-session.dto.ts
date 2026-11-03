import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateSessionDto {
  @ApiProperty({
    example: 'Buổi sinh hoạt CLB IT - Tuần 10',
    description: 'Tên hoặc tiêu đề buổi sinh hoạt/phiên điểm danh',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'CLUB_IT_DUT',
    description: 'Mã câu lạc bộ hoặc nhóm hoạt động',
  })
  @IsString()
  @IsNotEmpty()
  clubCode: string;

  @ApiPropertyOptional({
    example: 'Điểm danh đầu giờ phòng F204 bằng BLE Beacon',
    description: 'Mô tả chi tiết nội dung phiên họp',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: '2026-11-03T17:00:00.000Z',
    description: 'Thời gian bắt đầu phiên điểm danh (ISO 8601)',
  })
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({
    example: '2026-11-03T18:30:00.000Z',
    description: 'Thời gian kết thúc phiên điểm danh (ISO 8601)',
  })
  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({
    example: 'FDA50693-A4E2-4FB1-AFCF-C6EB07647825',
    description: 'UUID phát sóng của thiết bị BLE (iBeacon hoặc thiết bị host)',
  })
  @IsString()
  @IsNotEmpty()
  beaconUuid: string;

  @ApiProperty({
    example: 100,
    description: 'Major number của BLE iBeacon (0 - 65535)',
    default: 1,
  })
  @IsInt()
  @Min(0)
  @Max(65535)
  major: number;

  @ApiProperty({
    example: 1,
    description: 'Minor number của BLE iBeacon (0 - 65535)',
    default: 1,
  })
  @IsInt()
  @Min(0)
  @Max(65535)
  minor: number;

  @ApiPropertyOptional({
    example: -80,
    description:
      'Ngưỡng RSSI tối thiểu (dBm). Càng gần 0 thì khoảng cách càng gần (ví dụ: -80 dBm tương đương khoảng 3-5 mét). Nếu điện thoại quét thấy RSSI thấp hơn ngưỡng này sẽ báo quá xa.',
    default: -80,
  })
  @IsInt()
  @IsOptional()
  minRssiThreshold?: number;

  @ApiPropertyOptional({
    example: 'SEC-8899',
    description: 'Mã PIN hoặc token bảo mật bổ sung (nếu muốn)',
  })
  @IsString()
  @IsOptional()
  secretToken?: string;
}

