import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { CheckInService } from './check-in.service';
import { CheckInRequestDto } from './dto/check-in-request.dto';

@ApiTags('2. Check-in & Proximity Records (Thực hiện Điểm danh & Lịch sử)')
@Controller('api/v1/check-in')
export class CheckInController {
  constructor(private readonly checkInService: CheckInService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Thực hiện điểm danh Proximity BLE từ điện thoại',
    description: `Sinh viên quét sóng Bluetooth của CLB, app mobile gửi:
1. UUID, Major, Minor của Beacon
2. Chỉ số RSSI (cường độ sóng nhận)
3. Mã sinh viên & Session ID
Hệ thống sẽ kiểm tra xem sinh viên có đang ở gần thiết bị host CLB hay không (RSSI >= ngưỡng quy định).`,
  })
  @ApiResponse({
    status: 200,
    description: 'Điểm danh BLE thành công (đã xác thực độ gần).',
  })
  @ApiResponse({
    status: 400,
    description: 'Tín hiệu BLE quá xa (RSSI yếu), sai UUID/Major/Minor hoặc ngoài giờ mở phiên.',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy phiên điểm danh.',
  })
  @ApiResponse({
    status: 409,
    description: 'Sinh viên đã điểm danh phiên này trước đó.',
  })
  checkIn(@Body() dto: CheckInRequestDto) {
    return this.checkInService.processCheckIn(dto);
  }

  @Get('student/:studentId')
  @ApiOperation({
    summary: 'Tra cứu toàn bộ lịch sử điểm danh của một sinh viên',
    description: 'Nhập mã số sinh viên (ví dụ: 21120001) để lấy danh sách các buổi sinh hoạt CLB đã tham gia.',
  })
  @ApiParam({ name: 'studentId', description: 'Mã số sinh viên cần tra cứu', example: '21120001' })
  @ApiResponse({
    status: 200,
    description: 'Lịch sử điểm danh của sinh viên.',
  })
  getHistoryByStudent(@Param('studentId') studentId: string) {
    return this.checkInService.getHistoryByStudent(studentId);
  }

  @Get('record/:id')
  @ApiOperation({
    summary: 'Xem chi tiết một bản ghi điểm danh',
    description: 'Lấy thông tin chi tiết của một lượt điểm danh cụ thể (RSSI, thời gian, tên thiết bị, v.v.).',
  })
  @ApiParam({ name: 'id', description: 'ID của bản ghi điểm danh (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết bản ghi điểm danh.',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy bản ghi.',
  })
  getRecordById(@Param('id') id: string) {
    return this.checkInService.getRecordById(id);
  }

  @Delete('record/:id')
  @ApiOperation({
    summary: 'Hủy / Xóa bản ghi điểm danh',
    description: 'Dành cho Quản trị viên/Chủ nhiệm CLB khi cần hủy lượt điểm danh không hợp lệ.',
  })
  @ApiParam({ name: 'id', description: 'ID của bản ghi điểm danh' })
  @ApiResponse({
    status: 200,
    description: 'Đã xóa bản ghi điểm danh thành công.',
  })
  deleteRecord(@Param('id') id: string) {
    return this.checkInService.deleteRecord(id);
  }
}

