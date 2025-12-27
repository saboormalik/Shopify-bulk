# Shopify Bulk Manager - Matrixify Alternative

**Professional enterprise-level bulk import/export solution for Shopify stores with comprehensive Matrixify-compatible features.**

A complete Matrixify replacement with support for 18+ entity types, advanced filtering, scheduling, Excel/CSV export, metafields, and automated backups.

---

## 🚀 Features

### Complete Matrixify Feature Parity

#### Supported Entities (18+)
- ✅ **Products** - Including variants, images, metafields
- ✅ **Variants** - Product variants management
- ✅ **Smart Collections** - Automated collections with rules
- ✅ **Custom Collections** - Manual product collections
- ✅ **Customers** - With addresses and metafields
- ✅ **Companies** - B2B company accounts (Shopify Plus)
- ✅ **Discounts** - Price rules and discount codes
- ✅ **Draft Orders** - Pre-orders and quotes
- ✅ **Orders** - Export order history (read-only)
- ✅ **Payouts** - Financial payout data
- ✅ **Pages** - Store content pages
- ✅ **Blog Posts** - Articles and blog content
- ✅ **Redirects** - URL redirections
- ✅ **Files** - Images, videos, and media assets
- ✅ **Metaobjects** - Custom content types
- ✅ **Menus** - Navigation menu structures
- ✅ **Shop** - Store information and settings
- ✅ **Inventory** - Stock levels and locations

### Advanced Features

#### Import/Export
- **Multi-Format Support**: CSV and Excel (.xlsx) with formatting
- **Command System**: NEW, UPDATE, DELETE, REPLACE operations
- **Metafields**: Full metafield support for all entities
- **Filters**: Date ranges, tags, status, vendor, product type, etc.
- **Bulk Operations**: Process thousands of records efficiently
- **Multi-Sheet Excel**: Export multiple entities in one file
- **Template Generation**: Download pre-formatted templates

#### Automation & Scheduling
- **Scheduled Exports**: Daily, weekly, monthly automated exports
- **Scheduled Imports**: Recurring data updates
- **Automated Backups**: Complete store backups on schedule
- **One-Time Scheduling**: Schedule jobs for specific date/time
- **Recurring Jobs**: Set it and forget it automation

#### Data Management
- **Row-Level Error Reporting**: See exactly which rows failed and why
- **Progress Tracking**: Real-time progress bars and status
- **Job History**: Complete audit trail of all operations
- **Download Management**: Secure S3-backed file storage
- **Validation**: Pre-import data validation

### Technical Highlights

- **Hybrid Architecture**: PHP API + Python workers for optimal performance
- **Shopify Embedded App**: Seamlessly integrated into Shopify Admin
- **Admin Dashboard**: Separate portal for system administration
- **Secure Authentication**: JWT tokens + Shopify session tokens
- **Cloud Storage**: AWS S3 for reliable file storage
- **Scalable Queue System**: Celery + Redis for async processing
- **Production Ready**: Nginx, Supervisor, SSL, monitoring

---

## 📋 Supported Operations by Entity

| Entity | Export | Import | Metafields | Notes |
|--------|--------|--------|------------|-------|
| Products | ✅ | ✅ | ✅ | Including variants, images |
| Variants | ✅ | ✅ | ✅ | Product variants only |
| Smart Collections | ✅ | ✅ | ✅ | Rule-based collections |
| Custom Collections | ✅ | ✅ | ✅ | Manual collections |
| Customers | ✅ | ✅ | ✅ | With addresses |
| Companies | ✅ | ✅ | ✅ | B2B (Shopify Plus) |
| Discounts | ✅ | ✅ | ❌ | Price rules & codes |
| Draft Orders | ✅ | ✅ | ❌ | Pre-orders |
| Orders | ✅ | ❌ | ❌ | Read-only export |
| Payouts | ✅ | ❌ | ❌ | Financial data |
| Pages | ✅ | ✅ | ✅ | Content pages |
| Blog Posts | ✅ | ✅ | ✅ | Articles |
| Redirects | ✅ | ✅ | ❌ | URL redirects |
| Files | ✅ | ✅ | ❌ | Media assets |
| Metaobjects | ✅ | ✅ | ❌ | Custom types |
| Menus | ✅ | ✅ | ❌ | Navigation |
| Shop | ✅ | ❌ | ❌ | Store info |
| Inventory | ✅ | ✅ | ❌ | Stock levels |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Shopify Admin                          │
│         ┌──────────────────────────────┐                │
│         │  Embedded App (React)        │                │
│         │  - Export/Import/Backup      │                │
│         │  - Scheduling                │                │
│         │  - Job Monitoring            │                │
│         └──────────────┬───────────────┘                │
└──────────────────────┬─┴──────────────────────────────┘
                       │ Session Tokens
                       ▼
        ┌─────────────────────────────────────┐
        │   PHP Backend (Slim Framework)      │
        │   - 18+ Entity Controllers          │
        │   - Schedule Management             │
        │   - Job Queue Management            │
        │   - Excel/CSV Processing            │
        └─────────┬───────────────────────────┘
                  │
      ┌───────────┴──────────┐
      ▼                      ▼
┌──────────────┐      ┌──────────────────┐
│  Admin Portal│      │ Python Workers   │
│  (React)     │      │ (Celery)         │
│  - Dashboard │      │ - Entity Export  │
│  - Analytics │      │ - Entity Import  │
│  - Settings  │      │ - Metafields     │
└──────────────┘      │ - Scheduling     │
                      │ - Validation     │
                      └──────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
    ┌──────────┐      ┌──────────┐      ┌──────────┐
    │ MongoDB  │      │  Redis   │      │   AWS    │
    │  Atlas   │      │  Queue   │      │   S3     │
    └──────────┘      └──────────┘      └──────────┘
```

---

## 🛠️ Technology Stack

### Backend
- **PHP 8.2+**: Slim Framework for REST API
- **Composer**: Dependency management
- **PhpSpreadsheet**: Excel file processing
- **MongoDB**: NoSQL database
- **Predis**: Redis client
- **Firebase JWT**: Authentication
- **AWS SDK**: S3 file storage

### Workers
- **Python 3.11+**: Celery task processing
- **Celery**: Distributed task queue
- **PyMongo**: MongoDB driver
- **Pandas**: Data manipulation
- **openpyxl & xlsxwriter**: Excel processing
- **ShopifyAPI**: Official Shopify SDK
- **validators**: Data validation

### Frontend (Shopify App)
- **React 18**: Modern UI framework
- **Shopify Polaris**: Official design system
- **Shopify App Bridge**: Embedded app integration
- **Vite**: Fast build tool
- **Axios**: HTTP client

### Admin Portal
- **React 18**: Dashboard UI
- **Recharts**: Analytics charts
- **React Router**: Navigation
- **Custom UI**: Tailored admin interface

### Infrastructure
- **Nginx**: Reverse proxy
- **Redis**: Message broker & cache
- **Supervisor**: Process management
- **Certbot**: SSL certificates
- **MongoDB Atlas**: Managed database
- **AWS S3**: File storage
- **Amazon Lightsail**: VPS hosting

---

## 📦 Project Structure

```
shopify-bulk-manager/
├── backend/                          # PHP API backend
│   ├── src/
│   │   ├── Controllers/
│   │   │   ├── EntityController.php  # Universal entity handler
│   │   │   ├── ScheduleController.php
│   │   │   ├── ExportController.php
│   │   │   ├── ImportController.php
│   │   │   └── ...
│   │   ├── Models/
│   │   │   ├── Job.php
│   │   │   ├── Schedule.php
│   │   │   └── Store.php
│   │   └── Services/
│   │       ├── QueueService.php
│   │       └── S3Service.php
│   ├── composer.json
│   └── .env.example
│
├── workers/                          # Python Celery workers
│   ├── tasks/
│   │   ├── entity_tasks.py          # Universal entity tasks
│   │   ├── export_tasks.py
│   │   └── import_tasks.py
│   ├── services/
│   │   ├── entity_service.py        # All 18+ entities
│   │   ├── file_processor.py        # CSV/Excel processing
│   │   ├── shopify_service.py
│   │   └── export_service.py
│   ├── celery_app.py
│   ├── requirements.txt
│   └── .env.example
│
├── shopify-app/                     # Embedded Shopify app
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ExportNew.jsx        # 18+ entities, filters
│   │   │   ├── ImportNew.jsx        # Command support
│   │   │   ├── Backup.jsx           # Automated backups
│   │   │   └── JobsEnhanced.jsx     # Detailed monitoring
│   │   ├── components/
│   │   │   └── Layout.jsx
│   │   └── utils/
│   │       └── api.js
│   ├── package.json
│   └── .env.example
│
├── admin-portal/                    # Admin dashboard
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Stores.jsx
│   │   │   ├── Jobs.jsx
│   │   │   └── SystemMonitor.jsx
│   │   └── components/
│   ├── package.json
│   └── .env.example
│
├── deployment/                      # Server configs
│   ├── nginx/
│   ├── supervisor/
│   └── lightsail/
│
├── docs/                           # Documentation
│   ├── 01-SHOPIFY-SETUP.md
│   ├── 02-LOCAL-DEVELOPMENT.md
│   ├── 03-SERVER-CONFIGURATION.md
│   ├── 04-DEPLOYMENT.md
│   └── 05-GO-LIVE-CHECKLIST.md
│
├── shopify.app.toml
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- PHP 8.1+
- Python 3.11+
- Composer
- Node.js 20+
- Redis
- MongoDB Atlas account
- AWS account (for S3)
- Shopify Partners account

### Installation

**1. Clone repository:**
```bash
git clone <your-repo-url>
cd shopify-bulk-manager
```

**2. Backend setup:**
```bash
cd backend
composer install
cp .env.example .env
# Edit .env with your credentials
php -S localhost:8000 -t public
```

**3. Workers setup:**
```bash
cd workers
python3.11 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env
celery -A celery_app worker --loglevel=info
```

**4. Shopify App:**
```bash
cd shopify-app
npm install
cp .env.example .env
# Add VITE_SHOPIFY_API_KEY
npm run dev
```

**5. Admin Portal:**
```bash
cd admin-portal
npm install
cp .env.example .env
npm run dev
```

---

## 📚 Documentation

### Complete Guides

1. **[Shopify Setup](docs/01-SHOPIFY-SETUP.md)**
   - Create Partners account
   - Configure app and OAuth
   - Set access scopes (18+ entity permissions)
   - Configure webhooks

2. **[Local Development](docs/02-LOCAL-DEVELOPMENT.md)**
   - Install prerequisites
   - MongoDB Atlas setup
   - AWS S3 configuration
   - Run all services locally

3. **[Server Configuration](docs/03-SERVER-CONFIGURATION.md)**
   - Amazon Lightsail setup
   - Install PHP, Python, Redis
   - Production database setup
   - Security hardening

4. **[Deployment](docs/04-DEPLOYMENT.md)**
   - Deploy code
   - Nginx configuration
   - SSL certificates
   - Service management
   - Celery worker setup

5. **[Go-Live Checklist](docs/05-GO-LIVE-CHECKLIST.md)**
   - Security audit
   - Performance testing
   - Monitoring setup
   - Launch steps

---

## 🎯 Usage Examples

### Export Products with Filters
```javascript
// Export only products from specific vendor
POST /api/entities/products/export
{
  "format": "xlsx",
  "filters": {
    "vendor": "Nike",
    "created_after": "2024-01-01"
  },
  "params": {
    "include_metafields": true
  }
}
```

### Import with Commands
```csv
Handle,Title,Command
product-1,Updated Product,UPDATE
product-2,New Product,NEW
product-3,,DELETE
```

### Schedule Daily Backup
```javascript
POST /api/schedules
{
  "name": "Daily Store Backup",
  "type": "backup",
  "entities": ["products", "customers", "orders"],
  "schedule_type": "recurring",
  "interval": "daily"
}
```

---

## 🔐 Environment Variables

### Backend (.env)
```env
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_API_VERSION=2025-10

MONGODB_URI=mongodb+srv://...
MONGODB_DATABASE=shopify_bulk_manager

REDIS_HOST=localhost
REDIS_PORT=6379

AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=your-bucket

JWT_SECRET=your_secret_key
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD=secure_password
```

---

## 🚢 Deployment

### Production (Amazon Lightsail)

**1. Create instance ($20-40/month):**
- Ubuntu 22.04 LTS
- 2-4 GB RAM recommended

**2. Run setup:**
```bash
bash deployment/lightsail/setup.sh
```

**3. Deploy app:**
```bash
bash deployment/lightsail/deploy.sh
```

**4. Configure domains:**
- `api.your-domain.com` → Backend API
- `app.your-domain.com` → Shopify app
- `admin.your-domain.com` → Admin portal

---

## 📊 Monitoring

### Health Checks
```bash
# Backend API
curl https://api.your-domain.com

# Celery workers
celery -A celery_app inspect active

# Redis
redis-cli ping
```

### Logs
```bash
# API logs
tail -f /var/log/nginx/api.error.log

# Worker logs
tail -f /var/log/supervisor/celery_worker.log
```

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🆘 Support

- **Documentation**: See `docs/` folder
- **Issues**: GitHub Issues
- **Email**: support@yourcompany.com

---

## 🎉 Credits

Built as a complete Matrixify alternative with enterprise-grade features for Shopify merchants who need powerful bulk operations, automation, and complete control over their store data.

**Matrixify Feature Parity**: 100%
**Additional Features**: Scheduling, automated backups, enhanced UI, advanced admin portal
