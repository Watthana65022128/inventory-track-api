# Inventory Tracking System - AI Coding Instructions

## Project Overview
NestJS-based **Inventory Management API** with a complete procurement workflow:  
**PR → PO → GR → Stock Management**

### Key Architecture
- **Pattern**: Modular Monolith (transaction integrity across modules)
- **Database**: PostgreSQL with TypeORM
- **Auth**: JWT with Access + Refresh tokens (global guard)
- **Security**: Role-based access control (RBAC), soft deletes, OWASP password validation

---

## Workflow & Roles

### Complete Procurement Flow
```
PR_CREATOR (employee)
  ↓ creates PR (Purchase Requisition)
PR_APPROVER 
  ↓ approves PR
PO_CREATOR (procurement staff)
  ↓ creates PO from approved PR (selects supplier, negotiates price)
PO_APPROVER
  ↓ approves PO
WAREHOUSE_STAFF
  ↓ creates GR (Goods Receipt), updates stock
```

### Role Capabilities
| Role | Permissions |
|------|-------------|
| `ADMIN` | Full access to everything |
| `PR_CREATOR` | Create/edit PR (DRAFT only), submit for approval |
| `PR_APPROVER` | Approve/reject PRs |
| `PO_CREATOR` | Create PO from approved PR, add supplier & pricing |
| `PO_APPROVER` | Approve POs (cannot approve own POs) |
| `WAREHOUSE_STAFF` | Create GR, transfer stock, adjust stock |

---

## Critical Business Rules

### Purchase Requisition (PR)
- **Statuses**: `DRAFT → PENDING → APPROVED/REJECTED → CONVERTED`
- PR must be `APPROVED` before creating PO
- Only editable in `DRAFT` status
- Cannot modify after `CONVERTED` to PO

### Purchase Order (PO)
- **Statuses**: `DRAFT → APPROVED → RECEIVING → COMPLETED/CANCELLED`
- Must reference an approved PR (`purchase_requisition_id`)
- PO Creator ≠ PO Approver (self-approval forbidden)
- Cannot cancel if any GR exists
- Supports partial receipts (status → `RECEIVING`)
- Auto-completes when all items received

### Stock Management
- All stock changes **MUST** be in transactions
- Every movement creates immutable log in `stock_movements`
- `stock_balance` = current snapshot per item-location
- Stock cannot go negative

---

## Code Patterns & Conventions

### Module Structure
```
src/modules/<module-name>/
├── <module>.module.ts
├── <module>.controller.ts
├── <module>.service.ts
├── entities/
│   └── <entity>.entity.ts
├── dto/
│   ├── create-<entity>.dto.ts
│   └── update-<entity>.dto.ts
└── services/              // Extracted helper services (e.g., TokenService)
    └── <helper>.service.ts
```

### Entity Conventions
- **Primary Keys**: UUID (`@PrimaryGeneratedColumn('uuid')`)
- **Timestamps**: `@CreateDateColumn`, `@UpdateDateColumn`
- **Soft Delete**: Use `@DeleteDateColumn` for Users, Items, Suppliers
- **Immutable Logs**: POs, GRs, stock_movements (never delete, use status)

### Authentication Guards
```typescript
// Public endpoint (no auth required)
@Public()
@Get('health')

// Authenticated (any logged-in user)
@Get('profile')
getCurrentUser(@CurrentUser() user) { }

// Role-restricted
@Roles(UserRole.ADMIN, UserRole.PO_CREATOR)
@Post('purchase-orders')
```

**Important**: Global `JwtAuthGuard` is enabled - use `@Public()` decorator to bypass.

### DTO Validation Examples
```typescript
// Email with domain whitelist
@IsAllowedEmailDomain()
@IsEmail()
email: string;

// Thai phone format (0XXXXXXXXX)
@Matches(/^0[0-9]{9}$/, { message: 'Invalid Thai phone format' })
phone: string;

// OWASP password
@IsStrongPassword({
  minLength: 8,
  minLowercase: 1,
  minUppercase: 1,
  minNumbers: 1,
  minSymbols: 1,
})
password: string;
```

### Transaction Pattern (Critical for GR)
```typescript
await this.dataSource.transaction(async (manager) => {
  // 1. Create GR
  const gr = await manager.save(GoodsReceipt, grData);
  
  // 2. For each item:
  for (const item of items) {
    await manager.save(GoodsReceiptItem, itemData);
    
    // 3. Create stock movement (IN)
    await manager.save(StockMovement, {
      movement_type: MovementType.IN,
      quantity: item.quantity,
      reference_type: ReferenceType.GOODS_RECEIPT,
      reference_id: gr.id,
    });
    
    // 4. Update stock balance
    const balance = await manager.findOne(StockBalance, { ... });
    balance.quantity += item.quantity;
    await manager.save(balance);
    
    // 5. Update PO item received quantity
    poItem.quantity_received += item.quantity;
    await manager.save(poItem);
  }
  
  // 6. Update PO status (RECEIVING/COMPLETED)
  po.status = allItemsReceived ? PoStatus.COMPLETED : PoStatus.RECEIVING;
  await manager.save(po);
});
```

---

## Key Files & References

### Configuration
- `src/config/database.config.ts` - PostgreSQL connection
- `src/config/jwt.config.ts` - Token expiry (access: 3600s, refresh: 604800s)
- `src/config/email.config.ts` - Allowed email domains

### Enums (src/common/enums/)
- `role.enum.ts` - User roles
- `pr-status.enum.ts` - PR workflow statuses
- `po-status.enum.ts` - PO workflow statuses
- `movement-type.enum.ts` - Stock movement types (IN, OUT, TRANSFER, ADJUSTMENT)
- `reference-type.enum.ts` - Movement reference types

### Global Guards & Decorators
- `jwt-auth.guard.ts` - Global auth guard (bypass with `@Public()`)
- `roles.guard.ts` - Role-based access control
- `@CurrentUser()` - Extract user from JWT payload
- `@Roles(...roles)` - Restrict endpoint to specific roles

### Implemented Modules (as of Dec 2025)
- ✅ **AuthModule**: Login, register, refresh tokens, logout
- ✅ **UsersModule**: CRUD with soft delete, role management
- ⏳ **Phase 3 - Master Data** (MUST complete first):
  - **CategoriesModule**: Hierarchical categories
  - **ItemsModule**: Item catalog (SKU, name, UOM, min_stock)
  - **LocationsModule**: Warehouse structure
  - **SuppliersModule**: Supplier management
- ⏳ **PurchaseRequisitionsModule**: PR selects items from master data
- ⏳ **PurchaseOrdersModule**: Creates PO from approved PR
- ⏳ **GoodsReceiptsModule**: Transaction-based stock updates

---

## Development Commands

```bash
# Start development server (hot reload)
npm run start:dev

# Build for production
npm run build

# Run tests
npm run test

# View API docs
# http://localhost:3000/api/docs
```

---

## Common Mistakes to Avoid

1. **Forgetting transactions** - All stock operations MUST be transactional
2. **Self-approval** - Validate `created_by_id ≠ approved_by_id`
3. **Status checks** - Always validate current status before transitions
4. **Password exposure** - Use `@Exclude()` decorator on password fields
5. **Missing @Public()** - Global JWT guard requires explicit bypass
6. **Duplicate logic** - Extract reusable services (see `TokenService` example)

---

## Next Implementation Priority

### ⚠️ Phase 3: Master Data (MUST DO FIRST)
1. **CategoriesModule** - Hierarchical categories for items
2. **ItemsModule** - Item catalog (SKU, name, UOM, category, min_stock)
3. **LocationsModule** - Warehouse structure (WAREHOUSE → ZONE → RACK → SHELF)
4. **SuppliersModule** - Supplier database

**Reason**: PR creation requires existing items. Users select from catalog, not create new items.

### Phase 4: Procurement Workflow
5. **PurchaseRequisitionsModule** - PR workflow (DRAFT → APPROVED)
6. **PurchaseOrdersModule** - PO creation from PR with supplier selection
7. **GoodsReceiptsModule** - Transaction-based stock updates
8. Inventory reports & stock transfers

---

## Testing Notes

- Write E2E tests for complete workflow: PR → PO → GR
- Mock external dependencies in unit tests
- Test transaction rollback scenarios
- Validate status transitions thoroughly

---

*Last updated: December 2025*  
*For detailed requirements, see: `INITIAL.md.md`*  
*For development history, see: `CLAUDE.md`*
