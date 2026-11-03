import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class ScannedBeaconDto {
  @ApiProperty({
    example: 'FDA50693-A4E2-4FB1-AFCF-C6EB07647825',
    description: 'UUID của Beacon/Peripheral BLE mà điện thoại người dùng quét thấy',
  })
  @IsString()
  @IsNotEmpty()
  uuid: string;

  @ApiProperty({
    example: 100,
    description: 'Major number quét được từ Beacon',
  })
  @IsInt()
  @Min(0)
  @Max(65535)
  major: number;

  @ApiProperty({
    example: 1,
    description: 'Minor number quét được từ Beacon',
  })
  @IsInt()
  @Min(0)
  @Max(65535)
  minor: number;

  @ApiProperty({
    example: -65,
    description:
      'Cường độ tín hiệu RSSI (dBm) đo được tại thời điểm quét. Thường từ -30 đến -95 dBm (giá trị càng lớn thì càng gần thiết bị host)',
  })
  @IsInt()
  rssi: number;

  @ApiPropertyOptional({
    example: -59,
    description:
      'Công suất phát đo tại khoảng cách 1 mét (TxPower), dùng để tính khoảng cách ước tính (mặc định -59 dBm)',
    default: -59,
  })
  @IsInt()
  @IsOptional()
  txPower?: number;
}

