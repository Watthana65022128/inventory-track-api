# แผนการพัฒนาระบบคลังสินค้า (Inventory Tracking System)

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
- **PO_CREATOR**: สร้าง PO (ไม่สามารถอนุมัติ PO ของตัวเองได้)
- **PO_APPROVER**: อนุมัติ PO เท่านั้น
- **WAREHOUSE_STAFF**: สร้าง GR, ย้ายสต็อก, ปรับสต็อก
- **VIEWER**: ดูข้อมูลอย่างเดียว

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
- PO Creator ≠ PO Approver (คนสร้างไม่สามารถอนุมัติเอง)
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
- first_name: VARCHAR(100)
- last_name: VARCHAR(100)
- role: ENUM (ADMIN, PO_CREATOR, PO_APPROVER, WAREHOUSE_STAFF, VIEWER)
- is_active: BOOLEAN
- created_at, updated_at: TIMESTAMP
```

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
```

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
```

#### 6. purchase_orders
```typescript
- id: UUID (PK)
- po_number: VARCHAR(50) UNIQUE
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

#### 7. purchase_order_items
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

#### 8. goods_receipts
```typescript
- id: UUID (PK)
- gr_number: VARCHAR(50) UNIQUE
- purchase_order_id: UUID (FK → purchase_orders.id)
- receipt_date: DATE
- confirmed_by_id: UUID (FK → users.id)
- notes: TEXT
- created_at, updated_at: TIMESTAMP
```

#### 9. goods_receipt_items
```typescript
- id: UUID (PK)
- goods_receipt_id: UUID (FK → goods_receipts.id) CASCADE
- item_id: UUID (FK → items.id)
- location_id: UUID (FK → locations.id)
- quantity: DECIMAL(10,2)
- notes: TEXT
- created_at: TIMESTAMP
```

#### 10. stock_movements
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

#### 11. stock_balance
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

-- Purchase Orders
CREATE INDEX idx_po_number ON purchase_orders(po_number);
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

### 7. PurchaseOrdersModule
**Key Operations:**
- Create PO (PO_CREATOR, ADMIN)
- Approve PO (PO_APPROVER, ADMIN)
- Cancel PO (ADMIN)
- List & Filter POs
- Get PO details with items

**Business Logic:**
```typescript
// Create PO
- Validate supplier exists
- Validate all items exist
- Generate PO number: PO-YYYYMMDD-XXXX
- Calculate total_amount
- Set status = DRAFT
- Set created_by_id = current user

// Approve PO
- Check status = DRAFT
- Check approved_by_id != created_by_id
- Set status = APPROVED
- Set approved_by_id, approved_at

// Cancel PO
- Check no GR created yet
- Set status = CANCELLED
```

### 8. GoodsReceiptsModule
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

### 9. InventoryModule
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

### Phase 4: Core Business Logic (Days 8-11)
16. Create PurchaseOrdersModule
    - PurchaseOrder entity
    - PurchaseOrderItem entity
    - Create PO service
    - Approve workflow
    - Cancel workflow
17. Create InventoryModule
    - StockMovement entity
    - StockBalance entity
    - Basic stock queries

### Phase 5: Warehouse Operations (Days 12-14)
18. Create GoodsReceiptsModule
    - GoodsReceipt entity
    - GoodsReceiptItem entity
    - Transaction logic for GR creation
    - Auto-update stock
    - Auto-update PO status
19. Complete InventoryModule
    - Transfer stock
    - Adjust stock
    - Low stock report

### Phase 6: Testing & Documentation (Days 15-16)
20. Write unit tests for critical services
21. Write E2E tests for main workflows
22. Complete Swagger documentation
23. Create README with setup instructions

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

1. PO Creator cannot approve their own PO
2. Cannot cancel PO if GR already created
3. Cannot receive more quantity than ordered
4. Stock balance cannot be negative
5. All stock updates must be in transactions
6. Every stock change creates immutable movement record
7. PO status auto-updates based on receipt progress

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
