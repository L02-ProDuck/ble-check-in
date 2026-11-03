import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UpdateSessionStatusDto {
  @ApiProperty({
    example: 'CLOSED',
    description: 'Trạng thái mới của phiên',
    enum: ['ACTIVE', 'CLOSED', 'CANCELLED'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['ACTIVE', 'CLOSED', 'CANCELLED'])
  status: string;
}

