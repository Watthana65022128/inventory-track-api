import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const { name, description, parent_id } = createCategoryDto;

    // Check if category name already exists at the same level
    const existingCategory = await this.categoryRepository.findOne({
      where: { name, parent_id: parent_id || IsNull() },
    });

    if (existingCategory) {
      throw new ConflictException(
        `Category "${name}" already exists at this level`,
      );
    }

    // If parent_id provided, validate parent exists
    let parent: Category | null = null;
    let level = 0;
    let path = name.toLowerCase().replace(/\s+/g, '-');

    if (parent_id) {
      parent = await this.categoryRepository.findOne({
        where: { id: parent_id },
      });

      if (!parent) {
        throw new NotFoundException(`Parent category with ID ${parent_id} not found`);
      }

      level = parent.level + 1;
      path = `${parent.path}.${name.toLowerCase().replace(/\s+/g, '-')}`;
    }

    const category = this.categoryRepository.create({
      name,
      description,
      parent_id,
      level,
      path,
    });

    return await this.categoryRepository.save(category);
  }

  async findAll(): Promise<Category[]> {
    return await this.categoryRepository.find({
      relations: ['parent', 'children'],
      order: { path: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async getTree(): Promise<Category[]> {
    // Get root categories (no parent)
    const rootCategories = await this.categoryRepository.find({
      where: { parent_id: IsNull() },
      relations: ['children'],
      order: { name: 'ASC' },
    });

    // Recursively load children
    for (const root of rootCategories) {
      await this.loadChildren(root);
    }

    return rootCategories;
  }

  private async loadChildren(category: Category): Promise<void> {
    if (category.children && category.children.length > 0) {
      for (const child of category.children) {
        const fullChild = await this.categoryRepository.findOne({
          where: { id: child.id },
          relations: ['children'],
        });

        if (fullChild && fullChild.children) {
          await this.loadChildren(fullChild);
        }
      }
    }
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findOne(id);

    // Check name uniqueness if name is being updated
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.categoryRepository.findOne({
        where: {
          name: updateCategoryDto.name,
          parent_id: updateCategoryDto.parent_id || category.parent_id || IsNull(),
        },
      });

      if (existingCategory && existingCategory.id !== id) {
        throw new ConflictException(
          `Category "${updateCategoryDto.name}" already exists at this level`,
        );
      }
    }

    // Prevent circular reference if parent_id is being updated
    if (updateCategoryDto.parent_id) {
      if (updateCategoryDto.parent_id === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }

      // Check if new parent is a descendant of this category
      const isDescendant = await this.isDescendant(
        id,
        updateCategoryDto.parent_id,
      );
      if (isDescendant) {
        throw new BadRequestException(
          'Cannot move category to its own descendant',
        );
      }

      // Validate parent exists
      const parent = await this.categoryRepository.findOne({
        where: { id: updateCategoryDto.parent_id },
      });
      if (!parent) {
        throw new NotFoundException(
          `Parent category with ID ${updateCategoryDto.parent_id} not found`,
        );
      }
    }

    // Update category
    Object.assign(category, updateCategoryDto);

    // Recalculate level and path if parent changed
    if (updateCategoryDto.parent_id !== undefined) {
      if (updateCategoryDto.parent_id) {
        const parent = await this.categoryRepository.findOne({
          where: { id: updateCategoryDto.parent_id },
        });
        category.level = parent!.level + 1;
        category.path = `${parent!.path}.${category.name.toLowerCase().replace(/\s+/g, '-')}`;
      } else {
        category.level = 0;
        category.path = category.name.toLowerCase().replace(/\s+/g, '-');
      }

      // Update all descendants' paths and levels
      await this.updateDescendantsPaths(category);
    } else if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      // Update path if name changed
      if (category.parent_id) {
        const parent = await this.categoryRepository.findOne({
          where: { id: category.parent_id },
        });
        category.path = `${parent!.path}.${category.name.toLowerCase().replace(/\s+/g, '-')}`;
      } else {
        category.path = category.name.toLowerCase().replace(/\s+/g, '-');
      }

      await this.updateDescendantsPaths(category);
    }

    return await this.categoryRepository.save(category);
  }

  private async isDescendant(
    ancestorId: string,
    descendantId: string,
  ): Promise<boolean> {
    const descendant = await this.categoryRepository.findOne({
      where: { id: descendantId },
      relations: ['parent'],
    });

    if (!descendant) {
      return false;
    }

    if (descendant.parent_id === ancestorId) {
      return true;
    }

    if (descendant.parent_id) {
      return await this.isDescendant(ancestorId, descendant.parent_id);
    }

    return false;
  }

  private async updateDescendantsPaths(category: Category): Promise<void> {
    const children = await this.categoryRepository.find({
      where: { parent_id: category.id },
    });

    for (const child of children) {
      child.level = category.level + 1;
      child.path = `${category.path}.${child.name.toLowerCase().replace(/\s+/g, '-')}`;
      await this.categoryRepository.save(child);
      await this.updateDescendantsPaths(child);
    }
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);

    // Check if category has children
    if (category.children && category.children.length > 0) {
      throw new BadRequestException(
        'Cannot delete category with child categories. Please delete child categories first.',
      );
    }

    // Check if category has items (will be checked when items module is implemented)
    // For now, just delete the category

    await this.categoryRepository.remove(category);
  }
}
