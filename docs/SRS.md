# Enterprise Resource Planning (ERP) System — Software Requirements Specification (SRS)

**Version:** 2.0  
**Date:** September 2026  
**Product:** Enterprise Resource Planning (ERP) System  
**License:** Apache License 2.0

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Overview](#2-system-overview)
3. [System Requirements](#3-system-requirements)
4. [Authentication & Security](#4-authentication--security)
5. [Role-Based Access Control (RBAC)](#5-role-based-access-control-rbac)
6. [Core ERP Modules](#6-core-erp-modules)
7. [Extended Modules](#7-extended-modules)
8. [AI Agent Infrastructure](#8-ai-agent-infrastructure)
9. [Reporting & Analytics](#9-reporting--analytics)
10. [Notification System](#10-notification-system)
11. [API & Integration Layer](#11-api--integration-layer)
12. [Frontend Architecture](#12-frontend-architecture)
13. [Infrastructure & DevOps](#13-infrastructure--devops)
14. [Performance & Caching](#14-performance--caching)
15. [Privacy & GDPR Compliance](#15-privacy--gdpr-compliance)
16. [Onboarding System](#16-onboarding-system)
17. [Demo Environment](#17-demo-environment)
18. [Version History](#18-version-history)

---

## 1. Introduction

### 1.1 Purpose

This document defines the complete software requirements for Enterprise Resource Planning (ERP) System, an open-source enterprise resource planning system. It consolidates all feature specifications, module definitions, security requirements, and compliance policies.

### 1.2 Scope

Enterprise Resource Planning (ERP) System provides a full-featured ERP platform covering 25+ business modules — from finance and inventory to AI-powered automation — suitable for businesses across 15 industries. The system is self-hosted and designed for deployment on shared hosting (cPanel), VPS, or cloud infrastructure.

### 1.3 Technology Stack

| Layer | Technology |
|-------|-----------|
| Backend | Laravel 13.8, PHP 8.3+ |
| Database | SQLite (default), MySQL 8.0+, PostgreSQL 13+ |
| Frontend | Vue 3, Pinia, Tailwind CSS 4, Vite |
| Authentication | Laravel Sanctum (token-based) |
| Caching | Redis (optional, with database fallback) |
| API Docs | OpenAPI / Swagger (L5-Swagger) |
| Testing | PHPUnit, SQLite in-memory (560 tests) |
| CI/CD | GitHub Actions |
| Containerisation | Docker (multi-stage builds) |

---

## 2. System Overview

### 2.1 Architecture

```
app/
├── Http/Controllers/Api/     # API controllers (one per module)
│   ├── BaseApiController.php  # Shared CRUD, validation, Redis cache helpers
│   ├── OpenApiSpec.php        # Swagger annotations
│   └── {Module}/
├── Models/{Module}/           # Eloquent models
├── Services/{Module}/         # Business logic services
├── Jobs/                      # Queue jobs (reports, webhooks, agents)
├── Console/Commands/          # Artisan commands
└── Exceptions/                # Custom exception hierarchy

database/
├── migrations/                # Migration files (full ERP schema + indexes)
├── factories/                 # Model factories for testing
└── seeders/                   # Database seeders

tests/Feature/                 # Feature tests (all modules)
resources/js/                  # Vue 3 + Pinia frontend
routes/api.php                 # All API route definitions
```

### 2.2 Entry Point

`public/index.php` → `bootstrap/app.php` → Laravel kernel

### 2.3 API Response Format

All API responses follow a consistent structure:
```json
{
  "success": true,
  "message": "Operation completed",
  "data": { }
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description",
  "errors": { }
}
```

---

## 3. System Requirements

### 3.1 Software Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| PHP | 8.3+ | 8.3+ |
| Composer | 2.x | Latest |
| Node.js | 18+ | 20+ LTS |
| Database | SQLite 3 | MySQL 8.0+ or PostgreSQL 13+ |
| Redis | N/A (optional) | 7.0+ |

### 3.2 Hardware Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| RAM | 4 GB | 8 GB+ |
| Storage | 10 GB | 20 GB+ |
| CPU | 2 cores | 4+ cores |

### 3.3 Hosting

The system supports:
- **Shared hosting** (cPanel) — SQLite or MySQL, no Redis
- **VPS / Dedicated server** — full stack with Redis and queue workers
- **Docker** — multi-stage build with nginx + PHP-FPM + Redis

---

## 4. Authentication & Security

### 4.1 Authentication Methods

| Method | Description |
|--------|-------------|
| **Email + Password** | Standard login with Argon2id hashing |
| **Laravel Sanctum** | Token-based API authentication |
| **TOTP 2FA** | Time-based one-time password via `TOTPService` |
| **Magic Link** | Passwordless login via email link |

### 4.2 Auth Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | User login, returns Bearer token |
| `/api/auth/register` | POST | User registration |
| `/api/auth/logout` | POST | Revoke current token |
| `/api/auth/profile` | GET | Get authenticated user profile |
| `/api/auth/password/reset` | POST | Password reset |

### 4.3 Security Features

- **Rate limiting**: Auth endpoints rate-limited (5 requests/minute); API endpoints via Laravel `throttle` middleware
- **CSRF protection**: Enabled for web routes
- **CORS**: Configurable origin allowlist (no wildcard `*`)
- **TOTP secrets**: Excluded from all API responses
- **Audit logging**: Login, password changes, role changes, data access/modification
- **Session management**: Configurable session lifetime and secure cookie settings
- **Password history**: Prevents password reuse
- **Security events**: Logged for forensic analysis

### 4.4 User Management

- Manual user creation by admin (no self-registration required)
- Admin manually distributes credentials
- Role assignment during user creation
- User activation/deactivation

---

## 5. Role-Based Access Control (RBAC)

### 5.1 Permission Model

- `User` → hasMany → `Role` (via `user_roles` pivot with `expires_at`)
- `Role` → hasMany → `Permission` (via `role_permissions` pivot)
- Permissions cached for 5 minutes per request
- `PermissionMiddleware` checks `permission:module.action` on every protected route

### 5.2 Default Roles

8 pre-seeded roles: `admin`, `manager`, `accountant`, `hr_manager`, `sales_rep`, `warehouse_manager`, `project_manager`, `viewer` — each with module-specific permissions.

### 5.3 Permission Format

`module.action` — e.g., `finance.view`, `finance.create`, `hr.delete`, `agents.execute`

### 5.4 Admin Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/roles` | GET | List all roles |
| `/api/v1/roles` | POST | Create role |
| `/api/v1/roles/{id}` | PUT | Update role |
| `/api/v1/roles/{id}` | DELETE | Delete role |
| `/api/v1/roles/{id}/permissions` | POST | Sync permissions |
| `/api/v1/roles/{id}/assign` | POST | Assign role to user |
| `/api/v1/roles/{id}/revoke` | POST | Revoke role from user |

---

## 6. Core ERP Modules

### 6.1 Finance Module

**Route prefix:** `/api/v1/finance/`  
**Controllers:** AccountController, TransactionController, JournalEntryController, ReportController, BudgetController, BudgetLineController  
**Services:** AccountService, JournalService, TransactionService, BudgetService, TaxService

#### Features
- Chart of Accounts management (CRUD)
- General Ledger with double-entry journal entries
- Accounts Payable / Receivable tracking
- Financial statements: Balance Sheet, Income Statement (P&L), Cash Flow Statement, Trial Balance
- Budget management with line items and approval workflow (draft → approved → closed)
- Budget vs. actuals variance calculation
- Tax rate management
- Multi-currency support via currency seeder

---

### 6.2 Inventory Module

**Route prefix:** `/api/v1/inventory/`  
**Controllers:** ProductController, CategoryController, WarehouseController, StockMovementController  
**Services:** ProductService

#### Features
- Product catalog management with SKU, barcode, category
- Inventory valuation methods: FIFO, LIFO, Weighted Average
- Stock tracking with adjustment history
- Multi-warehouse management
- Stock transfers between warehouses
- Stock movement audit trail
- Low stock alerts
- Barcode/RFID integration via model field

---

### 6.3 HR Module

**Route prefix:** `/api/v1/hr/`  
**Controllers:** EmployeeController, DepartmentController, LeaveRequestController, AttendanceController, PayrollController, DirectoryController, SelfServiceController, EmployeeDocumentController, HRTrackingController  
**Services:** EmployeeService, LeaveService, PayrollService

#### Features
- Employee records management (CRUD with employment types: full_time, part_time, contract, intern)
- Organisational chart with reporting hierarchy
- Department management
- Attendance tracking with overtime fields and bulk import
- Leave management with balance tracking, approval workflow, and public holidays
- Payroll processing with bulk run, payslip PDF generation, and cost centre breakdown
- Performance reviews
- Employee directory with org-chart component
- Employee self-service portal (apply leave, view payslips, update personal info)
- Employee document management
- HR tracking (overtime, shift, compliance)
- Employee profile view

---

### 6.4 Sales Module

**Route prefix:** `/api/v1/sales/`  
**Controllers:** CustomerController, OrderController, InvoiceController, CrmController  
**Services:** SalesService

#### Features
- Customer management (CRUD with credit limits, payment terms)
- Sales order lifecycle: `draft` → `confirmed` → `processing` → `shipped` → `delivered`
- Invoice management: `draft` → `sent` → `paid` / `overdue`
- CRM pipeline management with stage tracking
- Sales forecasting
- Quotes and proposals

---

### 6.5 Procurement Module

**Route prefix:** `/api/v1/procurement/`  
**Controllers:** VendorController, PurchaseOrderController  
**Services:** ProcurementService

#### Features
- Vendor management with evaluation
- Purchase order lifecycle: `draft` → `sent` → `confirmed` → `received`
- Requisition workflow
- Goods receipt processing
- 3-way PO matching (via AI skill)

---

### 6.6 Manufacturing Module

**Route prefix:** `/api/v1/manufacturing/`  
**Controllers:** BomController, WorkOrderController  
**Services:** ManufacturingService

#### Features
- Bill of Materials (BOM) management with component hierarchy
- Work order lifecycle: `planned` → `in_progress` → `completed`
- Production scheduling
- Quality control integration
- Costing calculation from BOM components

---

### 6.7 Project Management Module

**Route prefix:** `/api/v1/projects/`  
**Controllers:** ProjectController, TaskController, TimeEntryController  
**Services:** ProjectService

#### Features
- Project planning with status: `planning`, `active`, `on_hold`, `completed`, `cancelled`
- Priority levels: `low`, `medium`, `high`, `critical`
- Task management: `todo` → `in_progress` → `review` → `done`
- Time tracking with time entries
- Gantt chart data generation
- Resource allocation

---

### 6.8 Quality Module

**Route prefix:** `/api/v1/quality/`  
**Controllers:** CheckController, NonConformanceController  
**Services:** QualityService

#### Features
- Quality check types: `incoming`, `in_process`, `final`, `audit`
- Results: `pass`, `fail`, `conditional`
- Non-conformance tracking: `open` → `investigating` → `resolved` → `closed`
- Root cause analysis fields
- Integration with Manufacturing work orders

---

### 6.9 Asset Management Module

**Route prefix:** `/api/v1/assets/`  
**Controllers:** AssetController, MaintenanceController  
**Services:** AssetService

#### Features
- Asset lifecycle tracking (types: equipment, vehicle, building, furniture, IT, other)
- Asset status: `active`, `maintenance`, `retired`, `disposed`
- Depreciation methods: straight-line, declining balance, sum-of-years
- Maintenance records: preventive, corrective, emergency
- Depreciation schedule calculation

---

### 6.10 Field Service Module

**Route prefix:** `/api/v1/field-service/`  
**Controllers:** TicketController  
**Services:** FieldServiceService

#### Features
- Service ticket management
- Priority and assignment tracking
- Status workflow
- Customer-linked tickets

---

### 6.11 LMS Module

**Route prefix:** `/api/v1/lms/`  
**Controllers:** CourseController, EnrollmentController  
**Services:** LearningService

#### Features
- Course management (types: online, classroom, blended)
- Student enrollment and progress tracking
- Course completion certificates

---

## 7. Extended Modules

### 7.1 Point of Sale (POS)

**Route prefix:** `/api/v1/pos/`  
**Controllers:** TerminalController, TransactionController

#### Features
- POS terminal management: `active`, `inactive`, `maintenance`
- Transaction lifecycle: `open` → `completed` / `voided` / `refunded`
- Payment methods: cash, card, bank_transfer, digital_wallet, other
- Designed for Retail & Hospitality industries

---

### 7.2 Fleet Management

**Route prefix:** `/api/v1/fleet/`  
**Controllers:** VehicleController, DriverController, TripController, FuelLogController, MaintenanceController, PartController, PartCategoryController, PartUsageController, FuelTrackingController, MaintenanceTrackingController

#### Features
- Vehicle management (car, truck, van, motorcycle, bus, trailer)
- Fuel types: gasoline, diesel, electric, hybrid
- Driver management with status tracking
- Trip management: `scheduled` → `in_progress` → `completed`
- Fuel log tracking
- Maintenance records (preventive, corrective, emergency, inspection)
- Parts inventory with categories and usage tracking
- Fleet analytics (fuel tracking, maintenance tracking)

---

### 7.3 Subscription & Recurring Billing

**Route prefix:** `/api/v1/subscription/`  
**Controllers:** PlanController, SubscriptionController, UsageController

#### Features
- Subscription plan management
- Subscription lifecycle tracking
- Usage metering for SaaS/technology businesses

---

### 7.4 Marketing Module

**Route prefix:** `/api/v1/marketing/`  
**Controllers:** CampaignController, LeadController

#### Features
- Campaign management with CRUD
- Lead management with scoring
- Lead-to-customer conversion (bridge to Sales CRM)
- Campaign analytics with daily seeding job
- Campaign ROI calculation endpoint (ROI %, ROAS, CPC, CPA)
- Email campaign sending via `CampaignEmailService`

---

### 7.5 Professional Network Module

**Route prefix:** `/api/v1/network/`  
**Controllers:** ProfileController, DiscoveryController, FollowController, ConnectionController, FeedController, PostController

#### Features
- User profiles with interests and avatar upload
- User discovery with discoverability privacy controls
- Follow/unfollow system
- Connection requests (mutual connection model)
- News feed (filtered to own posts + accepted connections + discoverable followed users)
- Post creation with image/attachment support
- Post reactions and comments
- CRM bridge: add discovered users to CRM or leads
- Notifications on connection requests and new followers
- Public profile view

---

### 7.6 Expense Management

**Route prefix:** `/api/v1/expenses/`  
**Controllers:** ExpenseController, ExpenseItemController

#### Features
- Expense report creation and approval workflow
- Expense item CRUD with receipt upload (jpg/png/pdf, 5MB max)
- 12 pre-seeded expense categories
- Expense summary dashboard widget

---

### 7.7 Budget & Forecasting

**Route prefix:** `/api/v1/finance/budgets/`  
**Controllers:** BudgetController, BudgetLineController

#### Features
- Budget creation with line items
- Approval workflow: draft → approved → closed
- Budget vs. actuals variance calculation
- Year-based filtering

---

### 7.8 Document Management

**Route prefix:** `/api/v1/documents/`  
**Controllers:** DocumentController

#### Features
- File upload with storage (50MB max)
- Folder management
- Document version history tracking
- Document sharing with cache-based secure tokens
- Polymorphic document attachment (link documents to Invoice, Contract, Employee, Asset)

---

### 7.9 Contract Management

**Route prefix:** `/api/v1/contracts/`  
**Controllers:** ContractController, ContractMilestoneController

#### Features
- Contract lifecycle management
- Milestone tracking with CRUD
- Contract expiry alerts (auto-notify 30/7/1 days before end_date via daily command)
- E-signature integration

---

### 7.10 E-Signature Module

**Route prefix:** `/api/v1/esignatures/`  
**Controllers:** ESignatureController

#### Features
- In-house electronic signature (no third-party dependency)
- Token-based signing with audit trail
- SHA-256 tamper detection
- Canvas drawing and typed signature modes
- Public signing page
- Linked to Contracts and Documents modules

---

### 7.11 Recruitment Module

**Route prefix:** `/api/v1/recruitment/`  
**Controllers:** RecruitmentController, PublicCandidateController

#### Features
- Job posting management
- Application tracking with pipeline stages
- Interview scheduling
- Offer letter generation with e-signature integration
- Public candidate portal (job listing, apply, status check)

---

### 7.12 Training & Certification

**Route prefix:** `/api/v1/training/`  
**Controllers:** TrainingController

#### Features
- Training program management
- Session scheduling
- Employee enrollment tracking
- Certification management with expiry alerts (30-day warning, daily at 08:30)
- Training completion reporting

---

### 7.13 Donor & Grant Management

**Route prefix:** `/api/v1/donors/`

#### Features
- Donor management for Non-Profit organisations
- Grant tracking and reporting
- Models, controllers, routes, factories, Vue views, sidebar navigation

---

## 8. AI Agent Infrastructure

### 8.1 Overview

The AI agent system is **completely optional** — no agent code affects core ERP operation. It provides AI-powered automation through a skill-based architecture.

### 8.2 Architecture

| Component | Location |
|-----------|----------|
| Agent profiles | `app/Models/Agent/AgentProfile.php` |
| Agent tokens | `app/Models/Agent/AgentToken.php` with rate limiting |
| Skill assignments | `app/Models/Agent/AgentSkillAssignment.php` |
| Execution log | `app/Models/Agent/AgentExecution.php` |
| Schedules | `app/Models/Agent/AgentSchedule.php` |
| Skill registry | `app/Services/Agent/SkillRegistry.php` |
| Execution service | `app/Services/Agent/AgentExecutionService.php` |
| Skill job | `app/Jobs/AgentSkillJob.php` |

### 8.3 AI Providers

| Provider | Service | Config |
|----------|---------|--------|
| Ollama (local) | `LocalModelService.php` | `OLLAMA_BASE_URL` |
| OpenRouter (cloud) | `OpenRouterService.php` | `AI_OPENROUTER_API_KEY` |

Default provider/model configured via `AI_DEFAULT_PROVIDER` and `AI_DEFAULT_MODEL` in `.env`.

### 8.4 Skills System

Skills are Markdown files with YAML frontmatter stored in `storage/app/skills/{category}/`. Each skill defines:

```yaml
---
name: Invoice Data Extraction
slug: finance.extract_invoice
version: "1.0"
category: finance
description: Extract vendor, amount, line items from an invoice
required_permissions:
  - finance.create
inputs:
  - name: document_text
    type: string
    required: true
outputs:
  - name: extracted_data
    type: object
model_tier: fast
cost_tier: low
tags: [finance, ocr, automation]
---
```

#### Skill Categories & Count

| Category | Skills |
|----------|--------|
| Finance | extract_invoice, categorize_transaction, match_purchase_order, forecast_cashflow, reconcile_accounts, budget_variance_analysis, audit_trail_summary, tax_return_prep, scenario_planning, investor_report |
| HR | draft_job_description, generate_payslip_summary, draft_performance_review, onboard_employee, leave_coverage_check, interview_question_generator, benchmark_salaries, org_chart_analysis, training_needs_analysis |
| Sales | score_crm_lead, draft_quote, draft_followup_email, customer_churn_risk, upsell_opportunities, competitive_analysis, territory_planning, win_loss_analysis |
| Inventory | reorder_alert, demand_forecast, shrinkage_detection |
| Expenses | categorize_expense |
| Procurement | evaluate_vendor, rfq_generator, price_trend_analysis |
| Projects | generate_status_report, resource_allocation, retrospective_summary |
| Manufacturing | optimise_bom, production_schedule, yield_analysis |
| Quality | analyse_nonconformance, supplier_quality_report |
| Assets | maintenance_schedule, depreciation_schedule |
| Marketing | generate_campaign_brief, lead_nurture_sequence, campaign_performance |
| Contracts | review_terms |
| Documents | extract_contract_terms |
| Fleet | route_optimisation |

**Total:** 50+ skills across 14 categories

### 8.5 Skill Management Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/agents/skills` | GET | List all available skills |
| `/api/v1/agents/skills/upload` | POST | Upload new skill (admin, validates frontmatter) |
| `php artisan skills:sync` | CLI | Scan and list all parsed skills |

### 8.6 Agent Teams

Agent teams chain multiple agents via execution_order with input_mapping:
- `AgentTeamService.php` — orchestrates team execution
- 4 models, controller, 9 routes

### 8.7 Advanced Features

- **Skill marketplace**: GitHub import/install/uninstall for community skills
- **Multi-company agent sharing**: `AgentCompanyAccess` model for cross-company agents
- **Model cost tracking**: `AgentCostRecord` with summary/byAgent/bySkill/daily endpoints
- **Skill A/B testing**: `AgentAbTest` model with run and declareWinner actions
- **Agent audit export**: CSV export via `GET /agents/executions/export`
- **Execution webhook**: Fires `agent.execution.completed` event on completion

### 8.8 Frontend

- `AgentsView.vue` — list, filter, create agents
- `AgentDetailView.vue` — tabbed detail (Skills, Executions, API Tokens, Schedules)
- `SkillCatalogView.vue` — searchable/filterable skill catalog
- `SkillEnableModal.vue` — checkbox skill assignment
- `ScheduleCreateModal.vue` — cron preset buttons
- Pinia store: `agents.ts` with typed interfaces and execution polling

---

## 9. Reporting & Analytics

### 9.1 Report Generation

**Route prefix:** `/api/v1/reports/`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/reports/generate` | POST | Queue a report job |
| `/reports/{id}` | GET | Poll report status |
| `/reports/{id}/download` | GET | Download CSV or PDF |
| `/reports/scheduled` | GET/POST/DELETE | Manage scheduled reports |

#### Supported Report Types
1. Trial Balance
2. Income Statement
3. Balance Sheet
4. Cash Flow Statement
5. HR Attendance Report
6. HR Payroll Report
7. Sales Summary
8. Procurement Report

Reports are generated asynchronously via `ReportGenerationJob`, with per-report caching (1-hour deduplication) and PDF support via `barryvdh/laravel-dompdf`.

### 9.2 Report Maintenance

- `reports:run-scheduled` — Execute scheduled reports (Artisan command)
- `reports:clean-expired` — Clean expired report files (runs daily)

### 9.3 Analytics Module

**Route prefix:** `/api/v1/analytics/`

- Cross-module KPIs: revenue, HR metrics, inventory levels, sales funnel
- Per-module analytics drilldown with 5 dedicated views
- Scheduled analytics digest email (weekly, Monday 9:00 AM)
- Enhanced dashboard with live KPI cards

### 9.4 Reports Builder

Frontend view `ReportsBuilderView.vue` supports:
- Finance, Sales, Procurement, Projects report categories
- CSV export
- Scheduled report management view

---

## 10. Notification System

### 10.1 Channels

| Channel | Implementation |
|---------|---------------|
| In-app | `NotificationEnhancedController` — inbox, mark-read, bulk-delete |
| Email | `EmailDeliveryService` + `NotificationMail` mailable |
| Web Push | `PushDeliveryService` with VAPID keys |
| Webhook | `NotificationWebhook` model for external delivery |

### 10.2 Features

- Notification templates with CRUD and preview
- User notification preferences
- Push subscription management (`user_push_subscriptions` table)
- Automated notifications:
  - Connection requests / new followers (Network module)
  - Contract expiry alerts (30/7/1 days)
  - Certification expiry alerts (30 days)
  - Agent execution completion

---

## 11. API & Integration Layer

### 11.1 API Versioning

All module routes are wrapped in `Route::prefix('v1')` — all endpoints at `/api/v1/`.

### 11.2 Webhooks

| Component | Description |
|-----------|-------------|
| `Webhook` model | User-managed webhook subscriptions |
| `WebhookDelivery` model | Delivery log with retry tracking |
| `WebhookService` | Dispatch events to subscriber URLs |
| `WebhookDeliveryJob` | HMAC-SHA256 signed POST, exponential backoff, auto-disable after 10 failures |

#### Webhook Events
Eloquent observers fire webhooks on: `Transaction`, `Product`, `StockMovement`, `Order`, `Invoice` model events, plus `agent.execution.completed`.

#### Webhook Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/webhooks` | GET/POST/PUT/DELETE | Manage webhooks |
| `/api/v1/webhooks/{id}/test` | POST | Test-fire a webhook |
| `/api/v1/webhooks/{id}/deliveries` | GET | View delivery history |

### 11.3 Developer Portal

- Self-service API key management
- Usage analytics and rate limit tracking
- `ApiKey` model with `rate_limit_per_minute`
- `ApiKeyAuth` middleware for key-based authentication
- `DeveloperPortalController` with 5 routes

### 11.4 OpenAPI Documentation

- 80+ endpoint annotations in `OpenApiSpec.php` using PHP 8 attributes
- Interactive Swagger UI at `/api/documentation`
- Regenerate: `php artisan l5-swagger:generate`

---

## 12. Frontend Architecture

### 12.1 Technology

- **Framework:** Vue 3 with Composition API
- **State Management:** Pinia stores
- **Styling:** Tailwind CSS 4
- **Build:** Vite with TypeScript support
- **Routing:** Vue Router with lazy-loaded routes

### 12.2 Layout

- `MainLayout.vue` — sidebar navigation, breadcrumbs, user menu
- Responsive design with mobile support
- Collapsible sidebar with module grouping

### 12.3 Shared Components

| Component | Purpose |
|-----------|---------|
| `DataTable.vue` | Sortable/filterable data tables |
| `ModalDialog.vue` | Reusable modal/dialog system |
| `NotificationContainer.vue` | Toast notification display |
| `Breadcrumbs.vue` | Navigation breadcrumbs |
| `LazyImage.vue` | IntersectionObserver-based lazy image loading |
| `OrgNode.vue` | Org chart node component |
| `SkillEnableModal.vue` | Skill assignment checkbox list |
| `ScheduleCreateModal.vue` | Cron schedule creation |

### 12.4 Module Views

All modules have dedicated Vue views in `resources/js/views/{module}/`:
- Finance, Inventory, HR, Sales, Procurement, Manufacturing, Projects, Quality, Assets, Field Service, LMS, POS, Fleet, Marketing, Network, Expenses, Documents, Contracts, Recruitment, Training, Agents, Reports, Notifications, Analytics, Onboarding, Webhooks, Settings, Developer Portal

### 12.5 Build Optimisation

- Lazy loading: all routes use dynamic imports
- Advanced chunking: `vite.config.ts` with manual chunks (vendor-vue)
- Code splitting with CSS code splitting enabled
- PWA offline support: service worker with cache-first/network-first strategies
- Bundle analysis: `npm run build:analyze` generates interactive treemap

### 12.6 Centralised Types

`resources/js/types/index.ts` — centralised TypeScript interfaces covering all 14+ modules.

---

## 13. Infrastructure & DevOps

### 13.1 CI/CD

- **GitHub Actions CI** (`.github/workflows/ci.yml`): Parallel PHP test + Node build jobs
- **PHPStan** (`.github/workflows/phpstan.yml`): Static analysis with graceful skip
- **Docker**: Multi-stage build (Node → Composer → PHP-FPM) with nginx + Redis
- **Supervisor**: Process management for queue workers

### 13.2 Monitoring

| Feature | Implementation |
|---------|---------------|
| Health check | `GET /health` — checks DB, cache, queue, disk, versions |
| Performance | `PerformanceMetrics` middleware, `X-Request-Time` header |
| Slow requests | Logged when exceeding threshold |
| Error tracking | Structured context in `bootstrap/app.php` (user_id, URL, IP) |
| Logging channels | `audit`, `agent_execution`, `error_log`, `performance` |

### 13.3 Setup Commands

```bash
composer install && npm install    # Install dependencies
cp .env.example .env && php artisan key:generate   # Configure env & app key
php artisan migrate --seed         # Run migrations & seed database
npm run dev                        # Start Vite dev server (Terminal 1)
php artisan serve                  # Start Laravel API server (Terminal 2)
php artisan test                   # Run automated tests
./vendor/bin/pint                  # Code formatting
```

---

## 14. Performance & Caching

### 14.1 Redis Caching

Tag-based invalidation via `BaseApiController::cacheRemember()` and `cacheFlush()`. Controllers with active caching:
- AccountController, ProductController, WarehouseController
- EmployeeController, DepartmentController
- CustomerController, VendorController
- ProjectController, CourseController

Falls back gracefully to `database` cache driver when Redis is unavailable.

### 14.2 Database Indexes

65+ performance indexes on:
- All foreign key columns
- Status/type filter columns
- Date columns used in range queries
- Composite indexes for common query patterns

Defined in `2026_05_31_095348_add_performance_indexes_to_erp_tables.php`.

---

## 15. Privacy & GDPR Compliance

### 15.1 Data Collection

The system processes:
- **Account data**: Name, email, phone, company, credentials, profile preferences
- **Business data**: Customers, vendors, employees, financial transactions, inventory, orders, projects
- **Usage data**: Access logs, API usage statistics, feature usage (when analytics enabled)

### 15.2 GDPR Features

| Feature | Implementation |
|---------|---------------|
| Data export | User can request full data export |
| Right to erasure | Delete personal data on request |
| Consent tracking | `user_consents` table |
| Data processing log | `data_processing_log` table |
| Legal holds | Prevents deletion during legal proceedings |
| User disputes | Track and resolve data disputes |
| User objections | Record processing objections |

### 15.3 Security Measures

- **Encryption**: TLS in transit, AES-256 at rest
- **Access control**: RBAC with MFA support
- **Audit trail**: All data access and modifications logged
- **Breach notification**: 72-hour notification policy
- **Password security**: Argon2id hashing, password history

### 15.4 Data Retention

| Data Type | Retention Period |
|-----------|-----------------|
| Active account data | While account is active |
| Financial records | 7 years |
| Transaction records | 7 years |
| Audit logs | 7 years |
| Communication records | 3 years |
| Automated backups | 30 days |
| Inactive accounts | 2 years before deletion notice |

### 15.5 Cookie Policy

- **Essential**: Session management, security, load balancing
- **Functional**: User preferences, language, dashboard customisation
- **Analytics**: Page views, feature usage (optional, with consent)

---

## 16. Onboarding System

### 16.1 Overview

15-industry preset onboarding wizard that configures the ERP for a specific business type.

### 16.2 Workflow

1. User logs in for the first time
2. System detects `onboardingPending` flag
3. Redirects to 5-step onboarding wizard
4. User selects industry preset
5. System applies Chart of Accounts + department templates
6. Duplicate-safe logic prevents overwriting existing data

### 16.3 Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/onboarding/presets` | GET | List all industry presets |
| `/api/v1/onboarding/status` | GET | Check onboarding status |
| `/api/v1/onboarding/apply` | POST | Apply selected preset |
| `/api/v1/onboarding/skip` | POST | Skip onboarding |
| `/api/v1/onboarding/reset` | POST | Re-run onboarding |

### 16.4 Industries

15 presets available via `OnboardingPresetSeeder`, each with full CoA and department templates.

---

## 17. Demo Environment

### 17.1 Demo Users

| Role | Email | Password |
|------|-------|----------|
| Administrator | admin@demo.erp-system.com | DemoAdmin2025! |
| Manager | manager@demo.erp-system.com | DemoManager2025! |
| Sales | sales@demo.erp-system.com | DemoSales2025! |
| HR | hr@demo.erp-system.com | DemoHR2025! |
| Accounting | accounting@demo.erp-system.com | DemoAccounting2025! |

### 17.2 Demo Data

The demo environment includes sample data for:
- Company setup (Technology industry, 50-200 employees)
- Products (Electronics, Clothing, Books, Home & Garden, Sports)
- Customers and vendors
- Sales orders and invoices
- Employees with attendance records
- Projects with tasks
- Financial accounts and transactions

### 17.3 Demo Restrictions

- Data export limited to 1,000 records
- Bulk operations limited to 100 items
- Demo watermark on reports
- Daily data reset (configurable)

---

## 18. Version History

### v1.0.0 (2025-06-23)

**Core Platform:**
- Laravel 13.8 backend with full REST API
- Vue 3 + Pinia + Tailwind CSS 4 frontend (SPA)
- Laravel Sanctum token-based authentication with magic link and TOTP 2FA
- Role-based access control middleware
- Redis tag-based cache invalidation
- Multi-database support: SQLite, MySQL, PostgreSQL
- OpenAPI/Swagger documentation for 59+ endpoints
- 191 feature tests

**Modules (v1.0):**
Finance, Inventory, HR, Sales, Procurement, Manufacturing, Projects, Quality, Assets, Field Service, LMS

**Security:**
- Auth rate limiting (5 req/min)
- TOTP/magic link token exclusion from API responses
- GDPR compliance tools
- Audit logging
- CSRF protection

**Developer Experience:**
- Step-by-step manual setup (`composer install`, `npm install`)
- Dual-server development workflow (`npm run dev`, `php artisan serve`)
- Automated test suite (`php artisan test`)
- Laravel Pint formatting
- 65+ database indexes

### v2.0 (2026-09)

**New Modules:**
POS, Fleet, Subscription, Marketing, Network, Expenses, Budget & Forecasting, Documents, Contracts, E-Signature, Recruitment, Training, Analytics, Donor/Grant Management, Developer Portal

**New Infrastructure:**
- AI Agent system with 50+ skills across 14 categories
- Webhook system with HMAC-SHA256 signing
- API versioning (v1)
- Full RBAC with 8 roles and per-route permission middleware
- Onboarding wizard (15 industries)
- Report generation with PDF export
- Enhanced notification system (in-app, email, web push)
- Agent teams, skill marketplace, A/B testing, cost tracking

**Test Suite:** 560 tests across all modules
