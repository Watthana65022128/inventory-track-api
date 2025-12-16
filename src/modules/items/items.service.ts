import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from './entities/item.entity';
import { Category } from '../categories/entities/category.entity';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createItemDto: CreateItemDto): Promise<Item> {
    const { sku, category_id } = createItemDto;

    // Check if SKU already exists (including soft-deleted)
    const existingItem = await this.itemRepository.findOne({
      where: { sku },
      withDeleted: true,
    });

    if (existingItem) {
      if (existingItem.deleted_at) {
        throw new ConflictException(
          `Item with SKU "${sku}" exists but is deleted. Please restore it instead.`,
        );
      }
      throw new ConflictException(`Item with SKU "${sku}" already exists`);
    }

    // Validate category exists
    const category = await this.categoryRepository.findOne({
      where: { id: category_id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${category_id} not found`);
    }

    const item = this.itemRepository.create(createItemDto);
    return await this.itemRepository.save(item);
  }

  async findAll(includeDeleted = false): Promise<Item[]> {
    return await this.itemRepository.find({
      relations: ['category'],
      order: { created_at: 'DESC' },
      withDeleted: includeDeleted,
    });
  }

  async findOne(id: string, includeDeleted = false): Promise<Item> {
    const item = await this.itemRepository.findOne({
      where: { id },
      relations: ['category'],
      withDeleted: includeDeleted,
    });

    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }

    return item;
  }

  async findBySku(sku: string, includeDeleted = false): Promise<Item> {
    const item = await this.itemRepository.findOne({
      where: { sku },
      relations: ['category'],
      withDeleted: includeDeleted,
    });

    if (!item) {
      throw new NotFoundException(`Item with SKU ${sku} not found`);
    }

    return item;
  }

  async findByCategory(categoryId: string): Promise<Item[]> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    return await this.itemRepository.find({
      where: { category_id: categoryId },
      relations: ['category'],
      order: { name: 'ASC' },
    });
  }

  async search(searchTerm: string): Promise<Item[]> {
    const queryBuilder = this.itemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'category')
      .where('item.sku ILIKE :searchTerm', {
        searchTerm: `%${searchTerm}%`,
      })
      .orWhere('item.name ILIKE :searchTerm', {
        searchTerm: `%${searchTerm}%`,
      })
      .orWhere('item.description ILIKE :searchTerm', {
        searchTerm: `%${searchTerm}%`,
      })
      .orderBy('item.name', 'ASC');

    return await queryBuilder.getMany();
  }

  async update(id: string, updateItemDto: UpdateItemDto): Promise<Item> {
    const item = await this.findOne(id);

    // Validate category if being updated
    if (updateItemDto.category_id) {
      const category = await this.categoryRepository.findOne({
        where: { id: updateItemDto.category_id },
      });

      if (!category) {
        throw new NotFoundException(
          `Category with ID ${updateItemDto.category_id} not found`,
        );
      }
    }

    Object.assign(item, updateItemDto);
    return await this.itemRepository.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);

    // Check if item is used in any PR, PO, or has stock
    // (Will be implemented when those modules are ready)

    await this.itemRepository.softRemove(item);
  }

  async restore(id: string): Promise<Item> {
    const item = await this.findOne(id, true);

    if (!item.deleted_at) {
      throw new BadRequestException('Item is not deleted');
    }

    await this.itemRepository.restore(id);
    return await this.findOne(id);
  }

  async getLowStockItems(): Promise<Item[]> {
    // This will be implemented when stock_balance module is ready
    // For now, return items with minimum_stock > 0
    return await this.itemRepository.find({
      where: { is_active: true },
      relations: ['category'],
      order: { minimum_stock: 'DESC' },
    });
  }
}
