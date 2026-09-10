# Enterprise Resource Planning (ERP) System

An open-source Enterprise Resource Planning (ERP) system built on **Laravel 13.8** (PHP 8.3+) and **Vue 3**. Designed for scalability, modularity, and high performance, covering Finance, HR, Inventory, Sales, Procurement, Manufacturing, Projects, Quality Management, Assets, Field Service, LMS, and AI Agents.

---

## 🚀 Quick Start & Setup Guide

### 📋 Prerequisites

Ensure your development environment meets the following requirements:

* **PHP:** 8.3 or higher (with `pdo`, `mbstring`, `openssl`, `tokenizer`, `xml`, `curl` extensions)
* **Composer:** 2.x
* **Node.js:** 18.x or higher (LTS recommended) & `npm`
* **Database:** MySQL 8.0+, PostgreSQL 14+, or SQLite 3.35+

---

### 🔨 Installation Steps

#### Step 1: Clone Repository & Install Dependencies

```bash
git clone <repository-url>
cd erp-business

# Install PHP dependencies
composer install

# Install Node.js dependencies
npm install
```

#### Step 2: Environment Configuration

Copy the example environment file and generate the application encryption key:

```bash
# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate
```

#### Step 3: Database Setup

Choose your preferred database engine below and follow its setup instructions.

---

### 🗄️ Database Configuration Guide

#### 🔹 Option 1: MySQL Setup

1. **Create Database:**

```sql
CREATE DATABASE erp_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. **Configure `.env` File:**

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=erp_db
DB_USERNAME=root
DB_PASSWORD=
```

3. **Run Migrations and Seed Database:**

```bash
php artisan migrate --seed
```

---

#### 🔹 Option 2: PostgreSQL Setup

1. **Create Database:**

```sql
CREATE DATABASE erp_db;
```
*(Or via PostgreSQL CLI: `createdb -U postgres erp_db`)*

2. **Configure `.env` File:**

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=erp_db
DB_USERNAME=postgres
DB_PASSWORD=your_password
```

3. **Run Migrations and Seed Database:**

```bash
php artisan migrate --seed
```

---

#### 🔹 Option 3: SQLite Setup (Lightweight / Local Development)

1. **Create SQLite Database File:**

* **Linux / macOS / Git Bash:**
  ```bash
  touch database/database.sqlite
  ```
* **Windows PowerShell:**
  ```powershell
  New-Item -Path database/database.sqlite -ItemType File
  ```

2. **Configure `.env` File:**

```env
DB_CONNECTION=sqlite
# DB_DATABASE path is optional if using Laravel default (database/database.sqlite)
```

3. **Run Migrations and Seed Database:**

```bash
php artisan migrate --seed
```

---

#### Step 4: Run Application

Start the backend and frontend dev servers in **two separate terminal windows**:

* **Terminal 1 (Vite Dev Server):**
  ```bash
  npm run dev
  ```

* **Terminal 2 (Laravel API Server):**
  ```bash
  php artisan serve
  ```

Visit the application at: **`http://127.0.0.1:8000/`**

---

## 📑 Core Modules & Features

| Module | Features & Scope |
|---|---|
| **Finance** | Chart of Accounts, General Ledger, Journal Entries, Budgeting, Financial Reporting |
| **Inventory** | Product Management, Stock Movements, Warehouse Management, Valuation Methods (FIFO, LIFO, Average) |
| **HR & Payroll** | Employee Directory, Attendance, Leave Requests, Payroll Processing, Self-Service |
| **Sales & CRM** | Customer Directory, Quotations, Sales Orders, Invoicing, Sales Analytics |
| **Procurement** | Vendor Management, Purchase Orders, Goods Receipt |
| **Manufacturing** | Bill of Materials (BOM), Work Orders, Production Tracking |
| **Projects** | Project Planning, Task Management, Time Tracking, Milestones |
| **Quality** | Quality Checks (Incoming, In-process, Final), Non-Conformance Tracking |
| **Assets** | Asset Lifecycle, Straight-Line Depreciation, Maintenance Scheduling |
| **Field Service** | Ticket Dispatch, Field Logs, Service Tracking |
| **LMS** | Course Management, Enrollments, Employee Training |
| **AI Agents** | Optional AI Automation infrastructure supporting Ollama & OpenRouter |

---

## 🛠️ Common Developer Commands

```bash
# Run all automated test suites
php artisan test

# Run a specific test class or filter
php artisan test --filter AccountTest

# Database refresh with seed data
php artisan migrate:fresh --seed

# Code style formatting (Laravel Pint)
./vendor/bin/pint

# Regenerate OpenAPI / Swagger documentation
php artisan l5-swagger:generate

# View registered API routes
php artisan route:list --path=api
```

---

## 📚 API Documentation

All API endpoints follow RESTful standards under `/api/v1/` and are secured via **Laravel Sanctum**.

Interactive Swagger API documentation is available at:
`http://127.0.0.1:8000/api/documentation`

---

## 🔄 Development Workflow (Adding a New Feature)

When starting work on a new feature or module, follow this step-by-step development process:

### Step 1: Create a Feature Branch
```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

### Step 2: Backend Development (Laravel)
1. **Model & Migration:** Create Eloquent model under `app/Models/{Module}/` with `use HasFactory;` and add migration in `database/migrations/`.
2. **API Controller:** Create controller in `app/Http/Controllers/Api/{Module}/` extending `BaseApiController`. Set `protected string $cacheTag = 'tag_name';` for automatic caching.
3. **Routes:** Register REST routes in `routes/api.php` under `auth:sanctum` middleware.
4. **Factory & Seeder:** Add factory in `database/factories/{Module}/` for automated tests.

### Step 3: Frontend Development (Vue 3)
1. **View Component:** Create Vue view component in `resources/js/views/{module}/{Feature}View.vue`.
2. **Route:** Register lazy-loaded route in `resources/js/router/index.ts`.
3. **API Integration:** Connect API using Pinia store or Axios.

### Step 4: Testing & Formatting
1. **Feature Tests:** Create test file under `tests/Feature/{Module}/`.
2. **Run Tests:**
   ```bash
   php artisan test --filter YourFeatureTest
   ```
3. **Code Formatting:**
   ```bash
   ./vendor/bin/pint
   ```
4. **Regenerate Swagger Docs (if API changed):**
   ```bash
   php artisan l5-swagger:generate
   ```

### Step 5: Commit & Push
```bash
git add .
git commit -m "feat(module): add your feature description"
git push origin feature/your-feature-name
```

---

## 🧪 Testing

The test suite works out-of-the-box for all supported databases (MySQL, PostgreSQL, SQLite, etc.) without affecting your production or development database.

```bash
# Run full test suite
php artisan test

# Run specific module or test file
php artisan test --filter AccountTest
```

---

## 📄 License

This project is open-source software licensed under the [Apache License 2.0](LICENSE).
