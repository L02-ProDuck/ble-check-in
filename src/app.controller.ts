import { Controller, Get, Res } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import type { Response } from 'express';

@Controller()
export class AppController {
  @Get()
  @ApiExcludeEndpoint()
  getRoot(@Res() res: Response) {
    return res.redirect('/docs');
  }

  @Get('health')
  @ApiExcludeEndpoint()
  getHealth() {
    return {
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'BLE Proximity Attendance Check-in API',
    };
  }
}
