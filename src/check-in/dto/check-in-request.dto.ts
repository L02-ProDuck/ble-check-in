import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ScannedBeaconDto } from './scanned-beacon.dto';

export class CheckInRequestDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID của phiên điểm danh (lấy từ API danh sách sessions)',
  })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({
    example: '21120001',
    description: 'Mã số sinh viên / Mã thành viên CLB',
  })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({
    example: 'Nguyễn Văn An',
    description: 'Họ và tên thành viên',
  })
  @IsString()
  @IsNotEmpty()
  studentName: string;

  @ApiPropertyOptional({
    example: 'iPhone 15 Pro - iOS 17.5',
    description: 'Tên model thiết bị hoặc định danh phần cứng điện thoại',
  })
  @IsString()
  @IsOptional()
  deviceId?: string;

  @ApiProperty({
    description: 'Dữ liệu quét sóng BLE thực tế từ điện thoại',
    type: ScannedBeaconDto,
  })
  @ValidateNested()
  @Type(() => ScannedBeaconDto)
  beaconData: ScannedBeaconDto;

  @ApiPropertyOptional({
    example: 'SEC-8899',
    description: 'Mã PIN bảo mật phiên nếu phiên yêu cầu xác thực thêm',
  })
  @IsString()
  @IsOptional()
  secretToken?: string;
}

