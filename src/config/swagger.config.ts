import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Inventory Tracking API')
    .setDescription('Backend API for Inventory Tracking System')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('categories', 'Category management')
    .addTag('items', 'Item management')
    .addTag('locations', 'Location management')
    .addTag('suppliers', 'Supplier management')
    .addTag('purchase-orders', 'Purchase Order management')
    .addTag('goods-receipts', 'Goods Receipt management')
    .addTag('inventory', 'Inventory and stock management')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
}
