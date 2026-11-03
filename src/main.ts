import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cho phép CORS cho tất cả client (Mobile app React Native/Flutter/Web)
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Tự động validate DTO và chuyển đổi kiểu dữ liệu
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Cấu hình Swagger OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('BLE Proximity Attendance Check-in API')
    .setDescription(
      `## Ứng dụng mobile điểm danh gần bằng Bluetooth (BLE proximity check-in) cho CLB/nhóm hoạt động
      
Tài liệu tương tác API chính thức dành cho ứng dụng di động điểm danh CLB.
Bao gồm 2 bộ API Collections hoàn chỉnh:
1. **Sessions & BLE Config**: Quản lý phiên họp/sinh hoạt CLB và tham số phát sóng BLE Beacon (UUID, Major, Minor, RSSI threshold).
2. **Check-in & Proximity Records**: Thực hiện điểm danh xác thực khoảng cách gần thông qua sóng BLE và tra cứu lịch sử điểm danh.`,
    )
    .setVersion('1.0.0')
    .addTag('1. Sessions & BLE Config (Quản lý Phiên điểm danh & Cấu hình BLE)')
    .addTag('2. Check-in & Proximity Records (Thực hiện Điểm danh & Lịch sử)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'BLE Check-in API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
    },
  });

  // Render sẽ cấp PORT tự động qua biến môi trường
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Server is running on: http://localhost:${port}`);
  console.log(`📚 Swagger Documentation is available at: http://localhost:${port}/docs`);
}
bootstrap();
