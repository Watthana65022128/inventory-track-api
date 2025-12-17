import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserRole } from '../../../common/enums/role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column()
  @Exclude() // Don't expose password in responses
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.WAREHOUSE_STAFF,
  })
  role: UserRole;

  @Column({ default: true })
  is_active: boolean;

  @Column({ nullable: true, length: 50 })
  first_name: string;

  @Column({ nullable: true, length: 50 })
  last_name: string;

  @Column({ nullable: true, length: 20 })
  phone: string;

  @Column({ type: 'text', nullable: true })
  refresh_token: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;
}
