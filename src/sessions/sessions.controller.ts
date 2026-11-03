import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionStatusDto } from './dto/update-session-status.dto';
import { SessionQueryDto } from './dto/session-query.dto';

@ApiTags('1. Sessions & BLE Config (Quản lý Phiên điểm danh & Cấu hình BLE)')
@Controller('api/v1/sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @ApiOperation({
    summary: 'Tạo phiên điểm danh mới kèm cấu hình BLE Beacon',
    description:
      'Host/Chủ nhiệm CLB tạo phiên điểm danh, thiết lập thông tin UUID phát sóng, Major, Minor và ngưỡng khoảng cách RSSI tối thiểu.',
  })
  @ApiResponse({ status: 201, description: 'Tạo phiên điểm danh thành công.' })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ.' })
  create(@Body() dto: CreateSessionDto) {
    return this.sessionsService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách tất cả các phiên điểm danh',
    description: 'Hỗ trợ lọc theo mã câu lạc bộ (clubCode) và trạng thái (status).',
  })
  @ApiResponse({ status: 200, description: 'Danh sách các phiên điểm danh.' })
  findAll(@Query() query: SessionQueryDto) {
    return this.sessionsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Chi tiết một phiên điểm danh & tham số BLE',
    description: 'Ứng dụng mobile sinh viên có thể gọi API này để lấy thông số UUID/Major/Minor cần quét.',
  })
  @ApiParam({ name: 'id', description: 'ID phiên điểm danh' })
  @ApiResponse({ status: 200, description: 'Chi tiết phiên điểm danh.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy phiên điểm danh.' })
  findOne(@Param('id') id: string) {
    return this.sessionsService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Cập nhật trạng thái phiên (Đóng/Mở lại phiên điểm danh)',
    description: 'Chuyển đổi trạng thái phiên sang ACTIVE, CLOSED hoặc CANCELLED.',
  })
  @ApiParam({ name: 'id', description: 'ID phiên điểm danh' })
  @ApiResponse({ status: 200, description: 'Cập nhật trạng thái thành công.' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSessionStatusDto,
  ) {
    return this.sessionsService.updateStatus(id, dto.status);
  }

  @Get(':id/attendees')
  @ApiOperation({
    summary: 'Xem danh sách thành viên đã điểm danh trong phiên',
    description: 'Trả về tổng số lượng và danh sách chi tiết các sinh viên đã điểm danh thành công.',
  })
  @ApiParam({ name: 'id', description: 'ID phiên điểm danh' })
  @ApiResponse({ status: 200, description: 'Danh sách thành viên điểm danh.' })
  getAttendees(@Param('id') id: string) {
    return this.sessionsService.getAttendees(id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Xóa phiên điểm danh',
    description: 'Xóa phiên điểm danh cùng toàn bộ lịch sử điểm danh liên quan.',
  })
  @ApiParam({ name: 'id', description: 'ID phiên điểm danh' })
  @ApiResponse({ status: 200, description: 'Xóa thành công.' })
  remove(@Param('id') id: string) {
    return this.sessionsService.remove(id);
  }
}

