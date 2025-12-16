import {
  IsString,
  IsOptional,
  MaxLength,
  IsUUID,
  IsNumber,
  Min,
  IsBoolean,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateItemDto {
  @ApiProperty({
    example: 'ITEM-001',
    description: 'Stock Keeping Unit (SKU) - must be unique',
  })
  @IsString()
  @MaxLength(50)
  @Matches(/^[A-Z0-9-]+$/, {
    message: 'SKU must contain only uppercase letters, numbers, and hyphens',
  })
  sku: string;

  @ApiProperty({
    example: 'Laptop Dell Inspiron 15',
    description: 'Item name',
  })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({
    example: 'High-performance laptop with 16GB RAM',
    description: 'Item description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Category ID',
  })
  @IsUUID()
  category_id: string;

  @ApiProperty({
    example: 'pcs',
    description: 'Unit of measure (e.g., pcs, kg, liter, box)',
  })
  @IsString()
  @MaxLength(20)
  unit_of_measure: string;

  @ApiPropertyOptional({
    example: 10,
    description: 'Minimum stock level for alerts',
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minimum_stock?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the item is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
