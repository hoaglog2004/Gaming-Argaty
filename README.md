# 🎮 Argaty - Gaming Gear E-Commerce Platform

<div align="center">

[![Java](https://img.shields.io/badge/Java-17+-ED8B00?style=for-the-badge&logo=java)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0.1-6DB33F?style=for-the-badge&logo=spring-boot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

A modern, full-stack e-commerce platform for gaming gear and accessories with JWT authentication, OAuth2 social login, and multiple payment integrations.

[Features](#-features) • [Tech Stack](#-tech-stack) • [Quick Start](#-quick-start) • [API Docs](#-api-examples) • [Contributing](#-contributing)

</div>

---

## 📋 Overview

**Argaty** is a production-ready e-commerce solution designed specifically for gaming equipment retailers. Built with modern technologies, it provides a seamless shopping experience with advanced features like social authentication, multiple payment methods, and a comprehensive admin dashboard.

### Key Highlights
- 🛍️ **Full-featured storefront** with product catalog, search, and filtering
- 💳 **Multiple payment methods** (COD, Bank Transfer, MoMo, ZaloPay)
- 🔐 **Enterprise-grade authentication** (JWT + OAuth2)
- 📊 **Powerful admin dashboard** for inventory and order management
- 🚀 **Modern tech stack** with Spring Boot 4 & React 19
- 📱 **Responsive design** optimized for all devices

---

## ✨ Features

### 👥 Customer Features

| Feature | Description |
|---------|-------------|
| 📦 **Product Catalog** | Browse products with categories, brands, and filtering |
| 🔍 **Advanced Search** | Smart search with autocomplete and filters |
| ❤️ **Wishlist** | Save favorite products for later |
| 🛒 **Shopping Cart** | Persistent cart with quantity management |
| 💰 **Checkout** | Multi-step checkout with address selection |
| 🎟️ **Voucher System** | Apply promo codes for discounts |
| 💳 **Payment Options** | COD, Bank Transfer, MoMo, ZaloPay |
| 👤 **User Profile** | Account settings and preferences |
| 📋 **Order Management** | View order history and tracking |
| ⭐ **Reviews** | Leave and view product reviews |
| 🔔 **Notifications** | Real-time order updates |

### 🛠️ Admin Features

| Feature | Description |
|---------|-------------|
| 📊 **Dashboard** | Real-time analytics and metrics |
| 📦 **Product Management** | Create, update, delete products |
| 🏷️ **Category Management** | Organize product categories |
| 🎨 **Brand Management** | Manage brand information |
| 🎯 **Banner Management** | Hero banners and promotions |
| 🎟️ **Voucher Management** | Create and manage discount codes |
| 📋 **Order Management** | Track and update order status |
| 👥 **User Management** | Manage customer accounts |

---

## 🏗️ Tech Stack

### Backend
```
┌─────────────────────────────────────┐
│  Spring Boot 4.0.1 (Java 17)        │
├─────────────────────────────────────┤
│ • Spring Web MVC                    │
│ • Spring Security + JWT             │
│ • Spring Data JPA + Hibernate       │
│ • OAuth2 Client (Google, Facebook)  │
│ • Spring Mail                       │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│  Data & Infrastructure              │
├─────────────────────────────────────┤
│ • SQL Server                        │
│ • jjwt (JWT library)                │
│ • GHN Shipping API                  │
└─────────────────────────────────────┘
```

### Frontend
```
┌─────────────────────────────────────┐
│  React 19 + Vite 8                  │
├─────────────────────────────────────┤
│ • React Router v6                   │
│ • Axios (HTTP client)               │
│ • Chart.js (Analytics)              │
│ • Modern CSS/Tailwind               │
└─────────────────────────────────────┘
```

---

## 📁 Project Structure

```
argaty/
├── 🔧 Backend (Spring Boot)
│   ├── src/main/java/com/argaty
│   │   ├── auth/              # Authentication & JWT
│   │   ├── controller/        # REST endpoints
│   │   ├── service/           # Business logic
│   │   ├── repository/        # Data access
│   │   ├── entity/            # JPA entities
│   │   ├── dto/               # Data transfer objects
│   │   ├── config/            # Spring configuration
│   │   └── util/              # Utility classes
│   ├── src/main/resources
│   │   ├── application.properties
│   │   ├── templates/         # Thymeleaf templates
│   │   └── static/            # Static files
│   ├── scripts/
│   │   └── update-products.sql  # Data initialization
│   └── pom.xml
│
├── 🎨 Frontend (React)
│   └── FE/
│       ├── src/
│       │   ├── components/    # React components
│       │   ├── pages/         # Page components
│       │   ├── services/      # API services
│       │   ├── hooks/         # Custom hooks
│       │   ├── context/       # Context providers
│       │   ├── styles/        # Global styles
│       │   └── utils/         # Utilities
│       ├── public/            # Static assets
│       ├── package.json
│       ├── vite.config.js
│       └── .env.example
│
└── 📄 Root configuration
    ├── README.md
    ├── .gitignore
    └── LICENSE
```

---

## 🚀 Quick Start

### Prerequisites

- **Java 17+** ([Download](https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html))
- **Maven 3.9+** ([Download](https://maven.apache.org/download.cgi))
- **Node.js 20+** ([Download](https://nodejs.org/))
- **npm 10+** (comes with Node.js)
- **SQL Server 2019+** ([Download](https://www.microsoft.com/en-us/sql-server/sql-server-downloads))

### Installation

#### 1️⃣ Clone Repository
```bash
git clone https://github.com/hoaglog2004/Gaming-Argaty.git
cd Gaming-Argaty
```

#### 2️⃣ Setup Database
```sql
-- Create database
CREATE DATABASE ArgatyDB;

-- (Optional) Restore from backup or run migration scripts
```

#### 3️⃣ Configure Backend
Create or update `src/main/resources/application.properties`:

```properties
# Database
spring.datasource.url=jdbc:sqlserver://localhost:1433;databaseName=ArgatyDB;encrypt=true;trustServerCertificate=true
spring.datasource.username=sa
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=update

# Server
server.port=8080

# JPA
spring.jpa.show-sql=false
spring.jpa.database-platform=org.hibernate.dialect.SQLServer2012Dialect
```

#### 4️⃣ Start Backend
```bash
# Using Maven wrapper
./mvnw spring-boot:run

# Or using installed Maven
mvn spring-boot:run
```

Backend will be available at: **http://localhost:8080**

#### 5️⃣ Start Frontend (New Terminal)
```bash
cd FE
npm install
npm run dev
```

Frontend will be available at: **http://localhost:5173**

**Vite Proxy (Auto-configured):**
- `/api/*` → `http://localhost:8080`
- `/uploads/*` → `http://localhost:8080`

---

## 🏗️ Build & Deployment

### Build Backend
```bash
# Clean and package
./mvnw clean package

# Output: target/Argaty-0.0.1-SNAPSHOT.jar

# Run packaged jar
java -jar target/Argaty-0.0.1-SNAPSHOT.jar
```

### Build Frontend
```bash
cd FE
npm run build    # Outputs to dist/
npm run preview  # Preview production build locally
```

---

## 🔐 Environment Configuration

### Essential Variables

#### Mail Configuration
```bash
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=noreply@argaty.com
APP_CONTACT_TO=support@argaty.com
```

#### Security & URLs
```bash
APP_BASE_URL=http://localhost:8080
APP_FRONTEND_URL=http://localhost:5173
APP_SECURITY_JWT_SECRET=your-very-long-random-secret-key-min-256-bits
APP_SECURITY_JWT_ACCESS_TOKEN_EXPIRY_MINUTES=30
APP_SECURITY_JWT_REFRESH_TOKEN_EXPIRY_DAYS=7
```

#### OAuth2 (Google & Facebook)
```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret
```

#### Payment Methods
```bash
# Bank Transfer
PAYMENT_BANK_ENABLED=true
PAYMENT_BANK_CODE=MB
PAYMENT_BANK_ACCOUNT_NO=1234567890
PAYMENT_BANK_ACCOUNT_NAME=Gaming Argaty Ltd

# MoMo
PAYMENT_MOMO_ENABLED=true
PAYMENT_MOMO_PARTNER_CODE=your-partner-code
PAYMENT_MOMO_ACCESS_KEY=your-access-key
PAYMENT_MOMO_SECRET_KEY=your-secret-key

# ZaloPay
PAYMENT_ZALOPAY_ENABLED=true
PAYMENT_ZALOPAY_APP_ID=your-app-id
PAYMENT_ZALOPAY_KEY1=your-key1
PAYMENT_ZALOPAY_KEY2=your-key2
```

#### Shipping (GHN)
```bash
SHIPPING_PRIMARY_PROVIDER=ghn
GHN_ENABLED=true
GHN_API_URL=https://dev-online-gateway.ghn.vn
GHN_TOKEN=your-ghn-token
GHN_SHOP_ID=your-shop-id
GHN_ORIGIN_CITY=249
GHN_ORIGIN_DISTRICT=1450
```

#### Admin Bootstrap (First Run Only)
```bash
APP_ADMIN_BOOTSTRAP_ENABLED=true
APP_ADMIN_BOOTSTRAP_EMAIL=admin@argaty.com
APP_ADMIN_BOOTSTRAP_PASSWORD=Admin@123
APP_ADMIN_BOOTSTRAP_FULL_NAME=System Administrator
```

### OAuth Redirect URIs

Configure these in your OAuth provider console:

```
http://localhost:8080/login/oauth2/code/google
http://localhost:8080/login/oauth2/code/facebook
```

---

## 📡 API Documentation

### Base URL
```
http://localhost:8080/api/v1
```

### API Groups

| Group | Endpoints | Purpose |
|-------|-----------|---------|
| `/auth` | login, refresh, logout, register | Authentication |
| `/products` | list, detail, search, filter | Product catalog |
| `/cart` | add, update, remove, list | Shopping cart |
| `/checkout` | preview, validate, place-order | Order creation |
| `/payments` | process, verify, history | Payment processing |
| `/orders` | list, detail, status, cancel | Order management |
| `/profile` | update, change-password, avatar | User profile |
| `/addresses` | list, add, update, delete | Delivery addresses |
| `/wishlist` | list, add, remove | Saved items |
| `/admin/*` | products, users, orders, vouchers | Admin panel |

### Example Requests

#### 🔐 Login
```bash
curl -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "rememberMe": true
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "id": 1,
    "fullName": "Nguyen Van A",
    "email": "user@example.com",
    "role": "USER"
  }
}
```

#### 🔄 Refresh Token
```bash
curl -X POST "http://localhost:8080/api/v1/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "your-refresh-token"}'
```

#### 📦 List Products
```bash
curl "http://localhost:8080/api/v1/products?page=1&size=12&keyword=keyboard&sort=newest"
```

#### 📝 Product Detail
```bash
curl "http://localhost:8080/api/v1/products/slug/logitech-g-pro-x-superlight"
```

#### 🛒 Place Order
```bash
curl -X POST "http://localhost:8080/api/v1/checkout/place-order" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "paymentMethod": "COD",
    "addressId": 1,
    "voucherCode": "SALE10",
    "note": "Please deliver during business hours"
  }'
```

#### 📤 Upload Avatar
```bash
curl -X POST "http://localhost:8080/api/v1/files/upload/avatar" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/avatar.png"
```

---

## 🐛 Troubleshooting

### Backend Issues

#### ❌ Database Connection Failed
```
Error: Cannot connect to SQL Server
```

**Solutions:**
- Verify SQL Server is running (`services.msc` on Windows)
- Check connection string: hostname, port (1433), database name
- Verify credentials: username and password
- Ensure firewall allows port 1433

#### ❌ Port 8080 Already in Use
```bash
# Find process using port
netstat -ano | findstr :8080

# Kill process (Windows)
taskkill /PID <PID> /F

# Or use different port
java -jar target/Argaty-0.0.1-SNAPSHOT.jar --server.port=8081
```

### Frontend Issues

#### ❌ Cannot Connect to Backend API
**Solutions:**
- Verify backend is running: `http://localhost:8080`
- Check frontend `.env` file points to correct backend URL
- Verify Vite proxy config: `FE/vite.config.js`
- Check browser console for CORS errors

#### ❌ Port 5173 Already in Use
```bash
# Use different port
npm run dev -- --port 3000
```

### Authentication Issues

#### ❌ OAuth2 Login Fails
**Solutions:**
- Verify client ID/secret in environment variables
- Check redirect URI is configured in OAuth provider console
- Ensure URLs match exactly: `http://localhost:8080/login/oauth2/code/google`
- Check JWT secret is set and strong enough

#### ❌ Images Not Loading
**Solutions:**
- Ensure `/uploads` directory exists in backend
- Verify Vite proxy for `/uploads` is configured
- Check backend has read permissions on upload directory

---

## 📊 Data Initialization

### Product Catalog Setup

After importing initial data, run the utility script to mark featured items:

```bash
# Execute in SQL Server Management Studio
sqlcmd -S localhost -U sa -P your_password -d ArgatyDB -i scripts/update-products.sql
```

**Script marks:**
- Featured products (homepage hero)
- New products (recent additions)
- Best-seller products (popular items)
- Featured categories

---

## 🏭 Production Deployment

### Pre-deployment Checklist

- [ ] Set `spring.jpa.show-sql=false`
- [ ] Set `server.error.include-stacktrace=never`
- [ ] Move all secrets to environment/secret manager
- [ ] Configure CORS and trusted origins
- [ ] Use strong, randomly-generated JWT secret (min 256 bits)
- [ ] Rotate JWT secrets periodically
- [ ] Disable admin bootstrap after first run
- [ ] Enable HTTPS/TLS
- [ ] Setup proper logging (no sensitive data)
- [ ] Configure database backups
- [ ] Setup monitoring and alerting

### Deployment Options

**Option 1: Docker**
```bash
docker build -t argaty:latest .
docker run -p 8080:8080 --env-file .env argaty:latest
```

**Option 2: Docker Compose**
```bash
docker-compose up -d
```

**Option 3: Cloud Platforms**
- AWS EC2 / ECS / Elastic Beanstalk
- Azure App Service / AKS
- Google Cloud Run / App Engine
- Heroku (if applicable)

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow existing code style and conventions
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure code compiles and all tests pass

---

## 📝 Development Workflow

1. **Start Services**
   ```bash
   # Terminal 1: Backend
   ./mvnw spring-boot:run
   
   # Terminal 2: Frontend
   cd FE && npm run dev
   ```

2. **Make Changes**
   - Edit code in your IDE
   - Changes auto-reload (Vite HMR for frontend)

3. **Validate Before Commit**
   ```bash
   # Backend
   ./mvnw clean test
   ./mvnw compile
   
   # Frontend
   npm run build
   npm run lint
   ```

4. **Git Workflow**
   ```bash
   git add .
   git commit -m "feat: clear description of changes"
   git push origin feature-branch
   ```

---

## 📞 Support & Contact

- 📧 **Email**: support@argaty.com
- 💬 **Issues**: [GitHub Issues](https://github.com/hoaglog2004/Gaming-Argaty/issues)
- 📖 **Wiki**: [Documentation](https://github.com/hoaglog2004/Gaming-Argaty/wiki)

---

## 📄 License

This project is licensed under the **MIT License** - see [LICENSE](LICENSE) file for details.

**Note:** This project is currently used for internal/educational development. Before public distribution, ensure proper licensing and compliance.

---

## 🙏 Acknowledgments

- Spring Boot & Spring Community
- React & Vite teams
- Contributors and maintainers

---

<div align="center">

**⭐ If you found this project helpful, please consider giving it a star!**

Made with ❤️ by the Argaty Team

</div>
