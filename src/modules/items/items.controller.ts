import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Items')
@ApiBearerAuth()
@Controller('items')
@UseGuards(RolesGuard)
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new item' })
  @ApiResponse({ status: 201, description: 'Item created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 409, description: 'Item with SKU already exists' })
  create(@Body() createItemDto: CreateItemDto) {
    return this.itemsService.create(createItemDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all items' })
  @ApiQuery({
    name: 'includeDeleted',
    required: false,
    type: Boolean,
    description: 'Include soft-deleted items',
  })
  @ApiResponse({ status: 200, description: 'Return all items' })
  findAll(@Query('includeDeleted') includeDeleted?: string) {
    const include = includeDeleted === 'true';
    return this.itemsService.findAll(include);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search items by SKU, name, or description' })
  @ApiQuery({
    name: 'q',
    required: true,
    type: String,
    description: 'Search term',
  })
  @ApiResponse({ status: 200, description: 'Return matching items' })
  search(@Query('q') searchTerm: string) {
    return this.itemsService.search(searchTerm);
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Get items by category' })
  @ApiResponse({ status: 200, description: 'Return items in category' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  findByCategory(@Param('categoryId') categoryId: string) {
    return this.itemsService.findByCategory(categoryId);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get items with low stock' })
  @ApiResponse({ status: 200, description: 'Return low stock items' })
  getLowStockItems() {
    return this.itemsService.getLowStockItems();
  }

  @Get('sku/:sku')
  @ApiOperation({ summary: 'Get item by SKU' })
  @ApiResponse({ status: 200, description: 'Return the item' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  findBySku(@Param('sku') sku: string) {
    return this.itemsService.findBySku(sku);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an item by ID' })
  @ApiResponse({ status: 200, description: 'Return the item' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  findOne(@Param('id') id: string) {
    return this.itemsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update an item' })
  @ApiResponse({ status: 200, description: 'Item updated successfully' })
  @ApiResponse({ status: 404, description: 'Item or category not found' })
  update(@Param('id') id: string, @Body() updateItemDto: UpdateItemDto) {
    return this.itemsService.update(id, updateItemDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Soft delete an item' })
  @ApiResponse({ status: 200, description: 'Item deleted successfully' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  remove(@Param('id') id: string) {
    return this.itemsService.remove(id);
  }

  @Patch(':id/restore')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Restore a soft-deleted item' })
  @ApiResponse({ status: 200, description: 'Item restored successfully' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  @ApiResponse({ status: 400, description: 'Item is not deleted' })
  restore(@Param('id') id: string) {
    return this.itemsService.restore(id);
  }
}
