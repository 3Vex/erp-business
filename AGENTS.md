# AGENTS.md

This file provides guidance to AI coding assistants (Claude, Gemini, Copilot, etc.) when working with code in this repository.

## Project Overview

Enterprise Resource Planning (ERP) System is an open-source system built on **Laravel 13.8** (PHP 8.3+). It covers Finance, Inventory, HR, Sales, Procurement, Manufacturing, Projects, Quality, Asset Management, Field Service, LMS, POS, Fleet, Subscription, Marketing, Network, Expenses, Budget & Forecasting, Documents, Contracts, Recruitment, Training, Analytics, Donor/Grant Management, and E-Signature modules.

The project runs fully on Laravel. Legacy framework code (`core/`, `api/`, `modules/`) has been deleted. All code lives in the Laravel layer.

## Commands

```bash
# First-time setup (installs deps, creates .env, creates SQLite DB, migrates, builds frontend)
composer run setup

# Start full dev environment (PHP server + queue + log viewer + Vite, concurrently)
composer run dev

# Run all tests (560 passing, in-memory SQLite — no DB setup needed)
composer run test

# Run a single test or filter by name
php artisan test --filter TestName
php artisan test tests/Feature/Finance/AccountTest.php

# Code formatting (Laravel Pint)
./vendor/bin/pint

# Database
php artisan migrate
php artisan migrate:fresh --seed

# Regenerate OpenAPI/Swagger docs
php artisan l5-swagger:generate

# Inspect registered routes
php artisan route:list --path=api

# AI Skills management
php artisan skills:sync

# Scheduled reports
php artisan reports:run-scheduled
php artisan reports:clean-expired

# Agent schedules
php artisan agents:run-schedules

# Bundle size analysis
npm run build:analyze
```

## Architecture

### Entry Point
`public/index.php` → `bootstrap/app.php` → Laravel kernel

### API Layer
All API controllers live under `app/Http/Controllers/Api/{Module}/` and extend [BaseApiController](app/Http/Controllers/Api/BaseApiController.php), which provides:
- `respondSuccess(string $message, mixed $data)` → `{"success": true, "message": ..., "data": ...}`
- `respondError(string $message, int $status, ?array $errors)` → `{"success": false, ...}`
- `respondCreated`, `respondNotFound`, `respondValidationError`
- `validate(array $data, array $rules)` — returns a `JsonResponse` on failure, `null` on pass
- `cacheRemember(string $key, callable $callback, ?int $ttl, ?string $tag)` — Redis tag-based caching with graceful fallback
- `cacheFlush(?string $tag)` — flush all cached data for a tag; called automatically on mutations when `$cacheTag` is set
- Default `index`, `store`, `show`, `update`, `destroy` implementations via injected `$model` property

To enable caching on a controller, set `protected string $cacheTag = 'your_tag';`. Mutations (`store`, `update`, `destroy`) automatically flush the tag.

### Models
Eloquent models live under `app/Models/{Module}/`. The ERP schema is defined across these migrations:
- `2026_05_26_133000_create_erp_tables.php` — full ERP schema
- `2026_05_28_000000_create_missing_erp_tables.php` — supplemental tables
- `2026_05_29_000000_create_gdpr_and_device_tables.php` — GDPR/device tables
- `2026_05_29_000001_create_roles_and_currencies_tables.php` — roles/currencies
- `2026_05_31_095348_add_performance_indexes_to_erp_tables.php` — 65+ performance indexes

Consult those migration files when creating or modifying models.

### Services
Business logic lives in `app/Services/{Module}/`. Controllers delegate complex operations to services.

### Frontend
Vite + Vue 3 + Pinia + Tailwind CSS 4. Entry points: `resources/css/app.css` and `resources/js/app.js`. All routes in `resources/js/router/index.ts` are lazy-loaded.

### OpenAPI / Swagger
All API endpoints are documented in [app/Http/Controllers/Api/OpenApiSpec.php](app/Http/Controllers/Api/OpenApiSpec.php) using PHP 8 attributes. Interactive UI at `/api/documentation`. Regenerate with `php artisan l5-swagger:generate`.

### Testing
Tests use SQLite in-memory (`DB_CONNECTION=sqlite`, `DB_DATABASE=:memory:`) — no real database needed to run the test suite. 560 tests pass across all modules. Feature tests in `tests/Feature/{Module}/`, factories in `database/factories/{Module}/`.

All model factories are in place. All key models have `HasFactory`. Test auth pattern:
```php
$user = User::factory()->create();
$token = $user->createToken('test')->plainTextToken;
$this->getJson('/api/...', ['Authorization' => "Bearer {$token}"]);
```

### Redis Caching
`CACHE_STORE=redis` enables tag-based invalidation (recommended for production). Falls back gracefully to `database` cache without tag support. Caching is active on controllers via `$cacheTag`: AccountController, ProductController, WarehouseController, EmployeeController, DepartmentController, CustomerController, VendorController, ProjectController, CourseController.

### AI Agent Infrastructure
- Agent profiles, tokens, skill assignments, executions, and schedules in `app/Models/Agent/`
- Skill registry scans `storage/app/skills/*.md` files with YAML frontmatter
- Supports Ollama (local) and OpenRouter (cloud) AI providers via `config/ai.php`
- Agent execution is fully optional — no agent code affects core ERP operation

## Module Overview

| Module | Controllers | Tests | Routes prefix |
|--------|-------------|-------|---------------|
| Finance | AccountController, TransactionController, JournalEntryController, ReportController, BudgetController, BudgetLineController | ✅ | `/api/v1/finance/` |
| Inventory | ProductController, CategoryController, WarehouseController, StockMovementController | ✅ | `/api/v1/inventory/` |
| HR | EmployeeController, DepartmentController, LeaveRequestController, AttendanceController, PayrollController, DirectoryController, SelfServiceController, EmployeeDocumentController, HRTrackingController | ✅ | `/api/v1/hr/` |
| Sales | CustomerController, OrderController, InvoiceController, CrmController | ✅ | `/api/v1/sales/` |
| Procurement | VendorController, PurchaseOrderController | ✅ | `/api/v1/procurement/` |
| Manufacturing | BomController, WorkOrderController | ✅ | `/api/v1/manufacturing/` |
| Projects | ProjectController, TaskController, TimeEntryController | ✅ | `/api/v1/projects/` |
| Quality | CheckController, NonConformanceController | ✅ | `/api/v1/quality/` |
| Assets | AssetController, MaintenanceController | ✅ | `/api/v1/assets/` |
| Field Service | TicketController | ✅ | `/api/v1/field-service/` |
| LMS | CourseController, EnrollmentController | ✅ | `/api/v1/lms/` |
| POS | TerminalController, TransactionController | ✅ | `/api/v1/pos/` |
| Fleet | VehicleController, DriverController, TripController, FuelLogController, MaintenanceController, PartController, PartCategoryController, PartUsageController | ✅ | `/api/v1/fleet/` |
| Subscription | PlanController, SubscriptionController, UsageController | ✅ | `/api/v1/subscription/` |
| Marketing | CampaignController, LeadController | ✅ | `/api/v1/marketing/` |
| Network | ProfileController, DiscoveryController, FollowController, ConnectionController, FeedController, PostController | ✅ | `/api/v1/network/` |
| Expenses | ExpenseController, ExpenseItemController | ✅ | `/api/v1/expenses/` |
| Documents | DocumentController | ✅ | `/api/v1/documents/` |
| Contracts | ContractController, ContractMilestoneController | ✅ | `/api/v1/contracts/` |
| E-Signature | ESignatureController | ✅ | `/api/v1/esignatures/` |
| Recruitment | RecruitmentController, PublicCandidateController | ✅ | `/api/v1/recruitment/` |
| Training | TrainingController | ✅ | `/api/v1/training/` |
| Notifications | NotificationEnhancedController, NotificationTemplateController | ✅ | `/api/v1/notifications/` |
| Analytics | AnalyticsController, ModuleAnalyticsController | ✅ | `/api/v1/analytics/` |
| Webhooks | WebhookController | ✅ | `/api/v1/webhooks/` |
| AI Agents | AgentController, AgentTokenController, AgentSkillController, AgentExecutionController, AgentScheduleController | ✅ | `/api/v1/agents/` |
| Onboarding | OnboardingController | ✅ | `/api/v1/onboarding/` |

## Adding a New Module

1. Create Eloquent models in `app/Models/{Module}/` — include `use HasFactory;`
2. Create controllers in `app/Http/Controllers/Api/{Module}/` extending `BaseApiController`
   - Set `protected string $cacheTag = 'your_module';` to enable auto cache invalidation
3. Register routes in `routes/api.php` under the `auth:sanctum` middleware group
4. Add missing tables as new migration files in `database/migrations/`
5. Create factories in `database/factories/{Module}/`
6. Add feature tests in `tests/Feature/{Module}/`
7. Add OpenAPI annotations to `app/Http/Controllers/Api/OpenApiSpec.php`, then `php artisan l5-swagger:generate`
8. Add a Vue view in `resources/js/views/{module}/` and register in `resources/js/router/index.ts`

## Enum Values (DB-enforced CHECK constraints)

SQLite enforces CHECK constraints that match the migration enums exactly. Use these values:

| Table | Column | Valid values |
|-------|--------|-------------|
| hr_employees | employment_type | `full_time` `part_time` `contract` `intern` |
| hr_employees | status | `active` `on_leave` `terminated` |
| inventory_products | valuation_method | `fifo` `lifo` `average` |
| projects | status | `planning` `active` `on_hold` `completed` `cancelled` |
| projects | priority | `low` `medium` `high` `critical` |
| project_tasks | status | `todo` `in_progress` `review` `done` `cancelled` |
| project_tasks | priority | `low` `medium` `high` `critical` |
| quality_checks | type | `incoming` `in_process` `final` `audit` |
| quality_checks | result | `pass` `fail` `conditional` *(nullable)* |
| quality_non_conformances | status | `open` `investigating` `resolved` `closed` |
| assets | type | `equipment` `vehicle` `building` `furniture` `it` `other` |
| assets | status | `active` `maintenance` `retired` `disposed` |
| assets | depreciation_method | `straight_line` `declining` `sum_of_years` |
| asset_maintenance | type | `preventive` `corrective` `emergency` |
| lms_courses | type | `online` `classroom` `blended` |
| procurement_purchase_orders | status | `draft` `sent` `confirmed` `received` `cancelled` |
| sales_orders | status | `draft` `confirmed` `processing` `shipped` `delivered` `cancelled` |
| sales_invoices | status | `draft` `sent` `paid` `overdue` `cancelled` |
| manufacturing_work_orders | status | `planned` `in_progress` `completed` `cancelled` |
| pos_terminals | status | `active` `inactive` `maintenance` |
| pos_transactions | status | `open` `completed` `voided` `refunded` |
| pos_payments | method | `cash` `card` `bank_transfer` `digital_wallet` `other` |
| fleet_vehicles | type | `car` `truck` `van` `motorcycle` `bus` `trailer` `other` |
| fleet_vehicles | fuel_type | `gasoline` `diesel` `electric` `hybrid` `other` |
| fleet_vehicles | status | `active` `inactive` `maintenance` `retired` |
| fleet_drivers | status | `active` `inactive` `suspended` |
| fleet_trips | status | `scheduled` `in_progress` `completed` `cancelled` |
| fleet_fuel_logs | fuel_type | `gasoline` `diesel` `electric` `hybrid` `other` |
| fleet_maintenance_records | type | `preventive` `corrective` `emergency` `inspection` |
| fleet_maintenance_records | status | `scheduled` `in_progress` `completed` `cancelled` |

## Code Conventions

- **API versioning**: All endpoints under `/api/v1/`. Legacy `/api/auth/*` routes maintained for backward compat.
- **Response format**: Always use `BaseApiController` response helpers — never return raw arrays.
- **Permissions**: Apply `permission:module.action` middleware to all route groups.
- **Testing**: Every new module must have minimum 70% test coverage.
- **Caching**: Every new feature must consider caching strategy.
- **AI agents**: Completely optional — no agent code affects ERP operation. Enable per-company via admin panel.
- **Code formatting**: Use Laravel Pint (`./vendor/bin/pint`).
