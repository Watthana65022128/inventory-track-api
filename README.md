# Inventory Tracking System

ระบบคลังสินค้า Backend API พัฒนาด้วย NestJS สำหรับจัดการ Purchase Orders, Goods Receipts, และ Stock Management

## 🚀 Features

- ✅ **Purchase Order Management** - สร้างและอนุมัติใบสั่งซื้อ
- ✅ **Goods Receipt** - รับสินค้าเข้าคลังแบบ partial receipt
- ✅ **Inventory Tracking** - ติดตามสต็อกและการเคลื่อนไหวสินค้า
- ✅ **Master Data** - จัดการ Items, Categories, Locations, Suppliers
- ✅ **Role-Based Access Control** - ระบบสิทธิ์แบบ 5 roles
- ✅ **JWT Authentication** - Access + Refresh Token

## 🛠️ Tech Stack

- **Framework**: NestJS 11.x
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT (Passport)
- **Documentation**: Swagger/OpenAPI
- **Language**: TypeScript

## 📋 Prerequisites

- Node.js >= 18.x
- PostgreSQL >= 14.x
- npm or yarn

## 🔧 Installation

```bash
# Clone repository
git clone <repository-url>
cd inventory-tracking

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# แก้ไข .env ให้ตรงกับ database ของคุณ
```

## 🗃️ Database Setup

```bash
# Create PostgreSQL database
createdb inventory_tracking

# หรือใน psql
psql -U postgres
CREATE DATABASE inventory_tracking;
```

## 🚀 Running the Application

```bash
# Development mode (with hot reload)
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

Application จะรันที่: `http://localhost:3000`

API Documentation (Swagger): `http://localhost:3000/api/docs`

## 📚 API Endpoints

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

*(เพิ่มเติมตาม modules อื่นๆ - ดูรายละเอียดใน INITIAL.md.md)*

## 🔑 User Roles

1. **ADMIN** - สิทธิ์เต็มทุกอย่าง
2. **PO_CREATOR** - สร้าง PO
3. **PO_APPROVER** - อนุมัติ PO
4. **WAREHOUSE_STAFF** - รับของ, ย้ายสต็อก

**Note**: พนักงานทุกคนสามารถดูข้อมูลได้ตาม role ของตัวเอง

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📁 Project Structure

```
src/
├── config/           # Configuration files
├── common/           # Shared utilities (guards, decorators, enums)
├── database/         # Migrations
└── modules/          # Business modules
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

## 📖 Documentation

- **แผนการพัฒนาละเอียด**: [INITIAL.md.md](INITIAL.md.md)
- **API Documentation**: http://localhost:3000/api/docs (เมื่อรันแอพ)

## 🏗️ Architecture

ระบบใช้ **Modular Monolith** pattern:
- แต่ละ module แยกจากกันชัดเจน
- ใช้ TypeORM transactions สำหรับ data consistency
- JWT Authentication แบบ global guard
- Role-based access control (RBAC)

## 🔒 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token-based authentication
- ✅ Input validation with class-validator
- ✅ CORS configuration
- ✅ SQL injection protection (TypeORM)
- ✅ Role-based access control

## 📝 Environment Variables

```env
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=inventory_tracking

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```

## 🤝 Contributing

ดูรายละเอียด implementation sequence ใน [INITIAL.md.md](INITIAL.md.md)

## 📄 License

[MIT License](LICENSE)
