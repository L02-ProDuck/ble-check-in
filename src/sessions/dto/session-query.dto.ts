import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SessionQueryDto {
  @ApiPropertyOptional({
    example: 'CLUB_IT_DUT',
    description: 'Lọc theo mã câu lạc bộ',
  })
  @IsString()
  @IsOptional()
  clubCode?: string;

  @ApiPropertyOptional({
    example: 'ACTIVE',
    description: 'Lọc theo trạng thái phiên (ACTIVE, CLOSED, CANCELLED)',
  })
  @IsString()
  @IsOptional()
  status?: string;
}

