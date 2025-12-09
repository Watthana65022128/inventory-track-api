# แผนการพัฒนาระบบคลังสินค้า (Inventory Tracking System)

## 🏗️ Current Implementation Status

### ✅ Phase 1: Foundation & Setup (COMPLETED)
- [x] Install dependencies (TypeORM, PostgreSQL, JWT, Passport, Swagger, class-validator)
- [x] Setup database configuration
- [x] Setup TypeORM connection
- [x] Create base enums (UserRole, PoStatus, MovementType, ReferenceType, LocationType)
- [x] Setup global pipes, filters, interceptors
- [x] Setup Swagger documentation

### 📁 Current Project Structure
```
src/
├── main.ts                           ✅ Configured with Swagger, CORS, Validation
├── app.module.ts                     ✅ Configured with TypeORM, Config
├── config/
│   ├── database.config.ts            ✅
│   ├── jwt.config.ts                 ✅
│   └── swagger.config.ts             ✅
├── common/
│   ├── decorators/
│   │   ├── roles.decorator.ts        ✅
│   │   ├── current-user.decorator.ts ✅
│   │   └── public.decorator.ts       ✅
│   ├── guards/
│   │   ├── jwt-auth.guard.ts         ✅
│   │   └── roles.guard.ts            ✅
│   ├── filters/
│   │   └── http-exception.filter.ts  ✅
│   ├── pipes/
│   │   └── validation.pipe.ts        ✅
│   ├── enums/
│   │   ├── role.enum.ts              ✅
│   │   ├── po-status.enum.ts         ✅
│   │   ├── movement-type.enum.ts     ✅
│   │   └── reference-type.enum.ts    ✅
│   └── interfaces/
│       └── pagination.interface.ts   ✅
├── database/
│   └── migrations/                   ⏳ Empty (ready for migrations)
└── modules/                          ⏳ Empty (ready for business modules)
```

### 🔄 Architecture Pattern
**Modular Monolith** - ระบบออกแบบเป็น modules ที่แยกจากกัน แต่อยู่ใน monolithic application เดียว
- ✅ แต่ละ module มี boundaries ชัดเจน
- ✅ ใช้ TypeORM transactions สำหรับ data consistency
- ✅ JWT Authentication แบบ global guard
- ✅ Role-based access control (RBAC)

### 📦 Next Steps (Phase 2)
- [ ] Create User entity
- [ ] Create AuthModule (JWT strategy, login, register)
- [ ] Create UsersModule (CRUD with role management)

---

## สรุปความต้องการ

ระบบคลังสินค้า Backend API ด้วย NestJS สำหรับจัดการ:
- การสร้างและอนุมัติใบสั่งซื้อ (Purchase Orders)
- การรับสินค้าเข้าคลัง (Goods Receipts)
- การติดตามสต็อกและการเคลื่อนไหวสินค้า
- การจัดการข้อมูลหลัก (Items, Categories, Locations, Suppliers)

## Technology Stack

- **Framework**: NestJS 11.x
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT (Access Token + Refresh Token)
- **Documentation**: Swagger/OpenAPI
- **Language**: TypeScript

## Business Rules

### Roles & Permissions
- **ADMIN**: สิทธิ์เต็มทุกอย่าง
- **PR_CREATOR**: พนักงานทั่วไป - สร้าง PR (ใบขอซื้อ)
- **PR_APPROVER**: อนุมัติ PR
- **PO_CREATOR**: พนักงานจัดซื้อ - สร้าง PO จาก PR ที่อนุมัติแล้ว (ไม่สามารถอนุมัติ PO ของตัวเองได้)
- **PO_APPROVER**: อนุมัติ PO เท่านั้น
- **WAREHOUSE_STAFF**: สร้าง GR, ย้ายสต็อก, ปรับสต็อก

**Note**: พนักงานทุกคนสามารถดูข้อมูลได้ตาม role ของตัวเอง ไม่จำเป็นต้องมี VIEWER role แยก

### Purchase Requisition (PR) Workflow
**Status Flow:**
```
DRAFT → PENDING → APPROVED → CONVERTED (to PO)
   ↓       ↓
CANCELLED  REJECTED
```

- **DRAFT**: สร้างใหม่ ยังแก้ไขได้
- **PENDING**: ส่งขออนุมัติแล้ว (รอ PR_APPROVER)
- **APPROVED**: PR_APPROVER อนุมัติแล้ว (พร้อมแปลงเป็น PO)
- **REJECTED**: PR_APPROVER ปฏิเสธ
- **CANCELLED**: ยกเลิก (ทำได้ก่อนอนุมัติเท่านั้น)
- **CONVERTED**: แปลงเป็น PO แล้ว

**Rules:**
- PR Creator สามารถแก้ไข PR ได้เฉพาะ status = DRAFT
- ส่งขออนุมัติ → status = PENDING
- PR_APPROVER อนุมัติ → status = APPROVED
- PO_CREATOR แปลง PR → PO → status = CONVERTED
- เมื่อ CONVERTED แล้วไม่สามารถแก้ไข PR ได้

### Purchase Order Workflow
**Status Flow:**
```
DRAFT → APPROVED → RECEIVING → COMPLETED
   ↓
CANCELLED
```

- **DRAFT**: สร้างใหม่ ยังแก้ไขได้
- **APPROVED**: ผู้อนุมัติอนุมัติแล้ว
- **RECEIVING**: กำลังรับของ (partial receipt)
- **COMPLETED**: รับของครบแล้ว
- **CANCELLED**: ยกเลิก (ทำได้ก่อนรับของเท่านั้น)

**Rules:**
- PO ถูกสร้างจาก PR ที่ status = APPROVED
- PO Creator ≠ PO Approver (คนสร้างไม่สามารถอนุมัติเอง)
- PO_CREATOR เลือก supplier, ต่อรองราคา, ใส่รายละเอียดเพิ่มเติม
- สามารถรับของเป็นครั้งๆ ได้ (Partial GR)
- เมื่อรับของบางส่วน → status = RECEIVING
- เมื่อรับของครบทุก item → status = COMPLETED

### Goods Receipt Workflow
- สร้าง GR → สต็อกอัพเดททันที
- สร้าง Stock Movement (IN) และอัพเดท Stock Balance พร้อมกันใน Transaction
- confirmed_by = ผู้สร้าง GR (WAREHOUSE_STAFF)

### Stock Management
- **Stock Movements**: บันทึกทุกการเคลื่อนไหว (immutable log)
- **Stock Balance**: Snapshot ปัจจุบัน per item per location
- **Movement Types**: IN (รับเข้า), OUT (เบิกออก), TRANSFER (ย้าย), ADJUSTMENT (ปรับปรุง)

### Master Data
- **Categories**: Multi-level hierarchy (Electronics → Phones → Smartphones)
- **Locations**: Hierarchical structure (Warehouse → Zone → Rack → Shelf)

## Database Schema

### Core Entities

#### 1. users
```typescript
- id: UUID (PK)
- username: VARCHAR(50) UNIQUE
- email: VARCHAR(100) UNIQUE
- password: VARCHAR(255) // bcrypt hashed
- first_name: VARCHAR(50)
- last_name: VARCHAR(50)
- phone: VARCHAR(20) // Thai format: 0XXXXXXXXX
- role: ENUM (ADMIN, PO_CREATOR, PO_APPROVER, WAREHOUSE_STAFF)
- is_active: BOOLEAN
- refresh_token: TEXT (nullable)
- created_at, updated_at: TIMESTAMP
- deleted_at: TIMESTAMP (nullable) // Soft delete
```

**Soft Delete**: ใช้ `DeleteDateColumn` เมื่อลบ record จะไม่ถูกลบออกจริง แต่จะ set `deleted_at` timestamp

#### 2. categories (Hierarchical)
```typescript
- id: UUID (PK)
- name: VARCHAR(100)
- description: TEXT
- parent_id: UUID (FK → categories.id)
- level: INTEGER
- path: VARCHAR(500) // "electronics.phones.smartphones"
- created_at, updated_at: TIMESTAMP
```

#### 3. items
```typescript
- id: UUID (PK)
- sku: VARCHAR(50) UNIQUE
- name: VARCHAR(200)
- description: TEXT
- category_id: UUID (FK → categories.id)
- unit_of_measure: VARCHAR(20) // "pcs", "kg", "liter"
- minimum_stock: DECIMAL(10,2)
- is_active: BOOLEAN
- created_at, updated_at: TIMESTAMP
- deleted_at: TIMESTAMP (nullable) // Soft delete
```

**Soft Delete Applied**: Items ใช้ soft delete เพื่อรักษา history ของ transactions

#### 4. locations (Hierarchical)
```typescript
- id: UUID (PK)
- code: VARCHAR(50) UNIQUE
- name: VARCHAR(100)
- type: ENUM (WAREHOUSE, ZONE, RACK, SHELF)
- parent_id: UUID (FK → locations.id)
- level: INTEGER
- path: VARCHAR(500) // "WH01.ZONE-A.RACK-01.SHELF-01"
- capacity: DECIMAL(10,2)
- is_active: BOOLEAN
- created_at, updated_at: TIMESTAMP
```

#### 5. suppliers
```typescript
- id: UUID (PK)
- code: VARCHAR(50) UNIQUE
- name: VARCHAR(200)
- contact_name: VARCHAR(100)
- contact_phone: VARCHAR(20)
- contact_email: VARCHAR(100)
- address: TEXT
- is_active: BOOLEAN
- created_at, updated_at: TIMESTAMP
- deleted_at: TIMESTAMP (nullable) // Soft delete
```

**Soft Delete Applied**: Suppliers ใช้ soft delete เพื่อรักษา history ของ POs

#### 6. purchase_requisitions
```typescript
- id: UUID (PK)
- pr_number: VARCHAR(50) UNIQUE
- status: ENUM (DRAFT, PENDING, APPROVED, REJECTED, CANCELLED, CONVERTED)
- request_date: DATE
- required_date: DATE
- purpose: TEXT // วัตถุประสงค์การขอซื้อ
- total_estimated_amount: DECIMAL(12,2)
- notes: TEXT
- created_by_id: UUID (FK → users.id)
- approved_by_id: UUID (FK → users.id)
- approved_at: TIMESTAMP
- rejected_reason: TEXT
- created_at, updated_at: TIMESTAMP
```

#### 7. purchase_requisition_items
```typescript
- id: UUID (PK)
- purchase_requisition_id: UUID (FK → purchase_requisitions.id) CASCADE
- item_id: UUID (FK → items.id)
- quantity_requested: DECIMAL(10,2)
- estimated_unit_price: DECIMAL(10,2)
- estimated_total_price: DECIMAL(12,2)
- notes: TEXT
- created_at: TIMESTAMP
```

#### 8. purchase_orders
```typescript
- id: UUID (PK)
- po_number: VARCHAR(50) UNIQUE
- purchase_requisition_id: UUID (FK → purchase_requisitions.id) // อ้างอิง PR
- supplier_id: UUID (FK → suppliers.id)
- status: ENUM (DRAFT, APPROVED, RECEIVING, COMPLETED, CANCELLED)
- order_date: DATE
- expected_date: DATE
- total_amount: DECIMAL(12,2)
- notes: TEXT
- created_by_id: UUID (FK → users.id)
- approved_by_id: UUID (FK → users.id)
- approved_at: TIMESTAMP
- created_at, updated_at: TIMESTAMP
- CONSTRAINT: approved_by_id != created_by_id
```

#### 9. purchase_order_items
```typescript
- id: UUID (PK)
- purchase_order_id: UUID (FK → purchase_orders.id) CASCADE
- item_id: UUID (FK → items.id)
- quantity_ordered: DECIMAL(10,2)
- quantity_received: DECIMAL(10,2) DEFAULT 0
- unit_price: DECIMAL(10,2)
- total_price: DECIMAL(12,2)
- notes: TEXT
- created_at: TIMESTAMP
```

#### 10. goods_receipts
```typescript
- id: UUID (PK)
- gr_number: VARCHAR(50) UNIQUE
- purchase_order_id: UUID (FK → purchase_orders.id)
- receipt_date: DATE
- confirmed_by_id: UUID (FK → users.id)
- notes: TEXT
- created_at, updated_at: TIMESTAMP
```

#### 11. goods_receipt_items
```typescript
- id: UUID (PK)
- goods_receipt_id: UUID (FK → goods_receipts.id) CASCADE
- item_id: UUID (FK → items.id)
- location_id: UUID (FK → locations.id)
- quantity: DECIMAL(10,2)
- notes: TEXT
- created_at: TIMESTAMP
```

#### 12. stock_movements
```typescript
- id: UUID (PK)
- item_id: UUID (FK → items.id)
- location_id: UUID (FK → locations.id)
- movement_type: ENUM (IN, OUT, TRANSFER, ADJUSTMENT)
- quantity: DECIMAL(10,2) // positive for IN, negative for OUT
- balance_after: DECIMAL(10,2)
- reference_type: ENUM (GOODS_RECEIPT, PURCHASE_ORDER, TRANSFER, ADJUSTMENT)
- reference_id: UUID
- notes: TEXT
- created_by_id: UUID (FK → users.id)
- created_at: TIMESTAMP
```

#### 13. stock_balance
```typescript
- id: UUID (PK)
- item_id: UUID (FK → items.id)
- location_id: UUID (FK → locations.id)
- quantity: DECIMAL(10,2) >= 0
- updated_at: TIMESTAMP
- UNIQUE(item_id, location_id)
```

### Important Indexes
```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

-- Categories
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_path ON categories(path);

-- Items
CREATE INDEX idx_items_sku ON items(sku);
CREATE INDEX idx_items_category ON items(category_id);
CREATE INDEX idx_items_name ON items(name);

-- Locations
CREATE INDEX idx_locations_code ON locations(code);
CREATE INDEX idx_locations_parent ON locations(parent_id);
CREATE INDEX idx_locations_path ON locations(path);

-- Purchase Requisitions
CREATE INDEX idx_pr_number ON purchase_requisitions(pr_number);
CREATE INDEX idx_pr_status ON purchase_requisitions(status);
CREATE INDEX idx_pr_created_by ON purchase_requisitions(created_by_id);
CREATE INDEX idx_pr_request_date ON purchase_requisitions(request_date);

-- Purchase Orders
CREATE INDEX idx_po_number ON purchase_orders(po_number);
CREATE INDEX idx_po_pr ON purchase_orders(purchase_requisition_id);
CREATE INDEX idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_po_status ON purchase_orders(status);
CREATE INDEX idx_po_order_date ON purchase_orders(order_date);

-- Stock
CREATE UNIQUE INDEX idx_sb_item_location ON stock_balance(item_id, location_id);
CREATE INDEX idx_sm_item ON stock_movements(item_id);
CREATE INDEX idx_sm_location ON stock_movements(location_id);
CREATE INDEX idx_sm_reference ON stock_movements(reference_type, reference_id);
CREATE INDEX idx_sm_created_at ON stock_movements(created_at);
```

## Project Structure

```
src/
├── main.ts
├── app.module.ts
├── config/
│   ├── database.config.ts
│   ├── jwt.config.ts
│   └── swagger.config.ts
├── common/
│   ├── decorators/
│   │   ├── roles.decorator.ts
│   │   ├── current-user.decorator.ts
│   │   └── public.decorator.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── pipes/
│   │   └── validation.pipe.ts
│   ├── enums/
│   │   ├── role.enum.ts
│   │   ├── po-status.enum.ts
│   │   ├── movement-type.enum.ts
│   │   └── reference-type.enum.ts
│   └── interfaces/
│       └── pagination.interface.ts
├── database/
│   └── migrations/
└── modules/
    ├── auth/
    ├── users/
    ├── categories/
    ├── items/
    ├── locations/
    ├── suppliers/
    ├── purchase-requisitions/
    ├── purchase-orders/
    ├── goods-receipts/
    └── inventory/
```

## Module Design

### 1. AuthModule
- JWT Strategy (access + refresh tokens)
- Login, Register, Refresh endpoints
- Password hashing with bcrypt

### 2. UsersModule
- CRUD operations
- Role management
- User profile

### 3. CategoriesModule
- CRUD operations
- Hierarchical tree structure
- GET /categories/tree

### 4. ItemsModule
- CRUD operations
- Search and filter by category
- SKU management

### 5. LocationsModule
- CRUD operations
- Hierarchical structure
- GET /locations/tree

### 6. SuppliersModule
- CRUD operations
- Supplier management

### 7. PurchaseRequisitionsModule
**Key Operations:**
- Create PR (PR_CREATOR, ADMIN)
- Submit PR for approval (PR_CREATOR)
- Approve/Reject PR (PR_APPROVER, ADMIN)
- Cancel PR (PR_CREATOR before APPROVED)
- List & Filter PRs
- Get PR details with items

**Business Logic:**
```typescript
// Create PR
- Validate all items exist
- Generate PR number: PR-YYYYMMDD-XXXX
- Calculate total_estimated_amount
- Set status = DRAFT
- Set created_by_id = current user

// Submit PR for approval
- Check status = DRAFT
- Set status = PENDING

// Approve PR
- Check status = PENDING
- Set status = APPROVED
- Set approved_by_id, approved_at

// Reject PR
- Check status = PENDING
- Set status = REJECTED
- Set rejected_reason

// Cancel PR
- Check status = DRAFT or PENDING
- Set status = CANCELLED
```

### 8. PurchaseOrdersModule
**Key Operations:**
- Create PO (PO_CREATOR, ADMIN)
- Approve PO (PO_APPROVER, ADMIN)
- Cancel PO (ADMIN)
- List & Filter POs
- Get PO details with items

**Business Logic:**
```typescript
// Create PO from PR
- Validate PR exists and status = APPROVED
- Validate supplier exists
- Copy items from PR
- PO_CREATOR can adjust quantities, add unit_price
- Generate PO number: PO-YYYYMMDD-XXXX
- Calculate total_amount
- Set status = DRAFT
- Set created_by_id = current user
- Set purchase_requisition_id = PR id

// Approve PO
- Check status = DRAFT
- Check approved_by_id != created_by_id
- Set status = APPROVED
- Set approved_by_id, approved_at

// Cancel PO
- Check no GR created yet
- Set status = CANCELLED
```

### 9. GoodsReceiptsModule
**Key Operations:**
- Create GR (WAREHOUSE_STAFF, ADMIN)
- Update PO status automatically
- List & Filter GRs

**Transaction Logic:**
```typescript
// Create GR (ใน Transaction)
1. Validate PO exists and status = APPROVED or RECEIVING
2. Validate all items belong to PO
3. Check quantity_received + new_quantity <= quantity_ordered
4. Generate GR number: GR-YYYYMMDD-XXXX
5. Create GR record
6. For each item:
   - Create GR item
   - Create stock movement (IN)
   - Update stock balance
   - Update PO item quantity_received
7. Update PO status:
   - If all items received completely → COMPLETED
   - Else → RECEIVING
8. Commit transaction
```

### 10. InventoryModule
**Key Operations:**
- Get stock balance (by item/location)
- Get stock movements history
- Transfer stock between locations
- Adjust stock (with reason)
- Stock reports (items below minimum)

**Transfer Logic:**
```typescript
// Transfer (ใน Transaction)
1. Create OUT movement (from location)
2. Update source balance (-quantity)
3. Create IN movement (to location)
4. Update destination balance (+quantity)
5. Both movements link to same reference_id
```

## API Endpoints Summary

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
```

### Users
```
GET    /api/users
POST   /api/users
GET    /api/users/:id
PATCH  /api/users/:id
DELETE /api/users/:id
```

### Categories
```
GET    /api/categories
GET    /api/categories/tree
POST   /api/categories
GET    /api/categories/:id
PATCH  /api/categories/:id
DELETE /api/categories/:id
```

### Items
```
GET    /api/items
POST   /api/items
GET    /api/items/:id
PATCH  /api/items/:id
DELETE /api/items/:id (soft delete)
```

### Locations
```
GET    /api/locations
GET    /api/locations/tree
POST   /api/locations
GET    /api/locations/:id
PATCH  /api/locations/:id
DELETE /api/locations/:id
```

### Suppliers
```
GET    /api/suppliers
POST   /api/suppliers
GET    /api/suppliers/:id
PATCH  /api/suppliers/:id
DELETE /api/suppliers/:id (soft delete)
```

### Purchase Requisitions
```
GET    /api/purchase-requisitions
POST   /api/purchase-requisitions
GET    /api/purchase-requisitions/:id
PATCH  /api/purchase-requisitions/:id
PATCH  /api/purchase-requisitions/:id/submit
PATCH  /api/purchase-requisitions/:id/approve
PATCH  /api/purchase-requisitions/:id/reject
PATCH  /api/purchase-requisitions/:id/cancel
DELETE /api/purchase-requisitions/:id (only DRAFT)
```

### Purchase Orders
```
GET    /api/purchase-orders
POST   /api/purchase-orders
GET    /api/purchase-orders/:id
PATCH  /api/purchase-orders/:id
PATCH  /api/purchase-orders/:id/approve
PATCH  /api/purchase-orders/:id/cancel
DELETE /api/purchase-orders/:id (only DRAFT)
```

### Goods Receipts
```
GET    /api/goods-receipts
POST   /api/goods-receipts
GET    /api/goods-receipts/:id
```

### Inventory
```
GET    /api/inventory/balance
GET    /api/inventory/movements
POST   /api/inventory/transfer
POST   /api/inventory/adjust
GET    /api/inventory/reports/low-stock
```

## Implementation Sequence

### Phase 1: Foundation & Setup (Days 1-2)
1. Install dependencies (TypeORM, PostgreSQL, JWT, Passport, Swagger, class-validator)
2. Setup database configuration
3. Setup TypeORM connection
4. Create base enums (UserRole, PoStatus, MovementType, ReferenceType, LocationType)
5. Setup global pipes, filters, interceptors
6. Setup Swagger documentation

### Phase 2: Authentication & Users (Days 3-4)
7. Create User entity
8. Create AuthModule (JWT strategy, login, register)
9. Create Guards (JwtAuthGuard, RolesGuard)
10. Create Decorators (@Roles, @CurrentUser)
11. Create UsersModule (CRUD with role management)

### Phase 3: Master Data Modules (Days 5-7)
12. Create CategoriesModule (with hierarchical support)
13. Create LocationsModule (with hierarchical support)
14. Create SuppliersModule
15. Create ItemsModule (linked to categories)

### Phase 4: Core Business Logic (Days 8-12)
16. Create PurchaseRequisitionsModule
    - PurchaseRequisition entity
    - PurchaseRequisitionItem entity
    - Create PR service
    - Submit/Approve/Reject workflow
    - Cancel workflow
17. Create PurchaseOrdersModule
    - PurchaseOrder entity
    - PurchaseOrderItem entity
    - Create PO from PR service
    - Approve workflow
    - Cancel workflow
18. Create InventoryModule
    - StockMovement entity
    - StockBalance entity
    - Basic stock queries

### Phase 5: Warehouse Operations (Days 13-15)
19. Create GoodsReceiptsModule
    - GoodsReceipt entity
    - GoodsReceiptItem entity
    - Transaction logic for GR creation
    - Auto-update stock
    - Auto-update PO status
20. Complete InventoryModule
    - Transfer stock
    - Adjust stock
    - Low stock report

### Phase 6: Testing & Documentation (Days 16-18)
21. Write unit tests for critical services
22. Write E2E tests for main workflows (PR → PO → GR)
23. Complete Swagger documentation
24. Create README with setup instructions

## Required NPM Packages

```json
{
  "dependencies": {
    "@nestjs/common": "^11.0.1",
    "@nestjs/core": "^11.0.1",
    "@nestjs/platform-express": "^11.0.1",
    "@nestjs/typeorm": "^10.0.0",
    "@nestjs/config": "^3.1.1",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.2",
    "@nestjs/swagger": "^7.1.16",
    "typeorm": "^0.3.17",
    "pg": "^8.11.3",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "passport-local": "^1.0.0",
    "bcrypt": "^5.1.1",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@types/passport-jwt": "^3.0.13",
    "@types/passport-local": "^1.0.38",
    "@types/bcrypt": "^5.0.2",
    "@types/node": "^22.10.7",
    "typescript": "^5.7.3"
  }
}
```

## Security Considerations

1. **Password Hashing**: bcrypt with 10 salt rounds
2. **JWT Secret**: Strong random string in environment variable
3. **Input Validation**: class-validator on all DTOs
4. **CORS**: Configure allowed origins
5. **SQL Injection**: TypeORM parameterized queries
6. **Role-Based Access**: Guards on all sensitive endpoints

## Key Design Patterns

1. **Repository Pattern**: TypeORM repositories
2. **Service Layer**: Business logic separated from controllers
3. **Transaction Management**: Critical for GR creation and stock updates
4. **Decorator Pattern**: Custom decorators for auth and roles
5. **DTO Pattern**: Request/Response validation

## Critical Business Rules to Implement

1. PR must be APPROVED before creating PO
2. PR Creator can only edit when status = DRAFT
3. PO must reference an APPROVED PR
4. PO Creator cannot approve their own PO
5. Cannot cancel PO if GR already created
3. Cannot receive more quantity than ordered
4. Stock balance cannot be negative
5. All stock updates must be in transactions
6. Every stock change creates immutable movement record
7. PO status auto-updates based on receipt progress

## Soft Delete Policy

**Entities with Soft Delete** (เก็บ history):
- ✅ **users**: รักษา created_by, updated_by references
- ✅ **items**: รักษา transaction history (POs, GRs, Stock Movements)
- ✅ **suppliers**: รักษา PO history
- ⚠️ **categories**: ไม่ soft delete (ถ้าลบต้องย้าย items ก่อน)
- ⚠️ **locations**: ไม่ soft delete (ต้องว่างก่อนลบ)

**Entities without Soft Delete** (hard delete or immutable):
- ❌ **purchase_orders**: Immutable (ใช้ status CANCELLED แทน)
- ❌ **goods_receipts**: Immutable (ไม่สามารถลบได้)
- ❌ **stock_movements**: Immutable log (ไม่สามารถลบได้)
- ❌ **stock_balance**: Snapshot (อัปเดตได้ ไม่ลบ)

**TypeORM Implementation**:
```typescript
// Entity with Soft Delete
@Entity()
export class User {
  @DeleteDateColumn()
  deleted_at: Date;
}

// Service Methods
await repository.softRemove(entity);  // Soft delete
await repository.restore(id);         // Restore
await repository.find({ withDeleted: true });  // Include deleted
```

## Database Migration Strategy

1. Use TypeORM migrations
2. Create initial schema migration
3. Seed data for:
   - Admin user
   - Sample categories
   - Sample locations
   - Sample items

## Notes

- Focus on transaction integrity for stock operations
- Use TypeORM QueryBuilder for complex queries
- Implement pagination for all list endpoints
- Use soft delete for items and suppliers
- Track created_at/updated_at on all entities
- Use UUID for all primary keys
