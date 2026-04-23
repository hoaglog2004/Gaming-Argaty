# Argaty - Gaming Gear E-Commerce Platform

Argaty is a full-stack e-commerce platform focused on gaming gear and accessories.

- Backend: Spring Boot 4, Spring Security, JPA, SQL Server
- Frontend: React 19 + Vite 8 (separate FE app)
- Auth: JWT + Refresh Token, OAuth2 social login
- Core modules: Catalog, cart, checkout, payment flow, profile, admin dashboard

## 1. Main Features

### Customer

- Browse products, categories, brands
- Search, filter, sort, product detail page
- Cart and wishlist
- Checkout with address and voucher
- Payment flow (COD, bank transfer, MoMo, ZaloPay)
- Profile management, order history, order detail
- Review and notification sections

### Admin

- Dashboard metrics
- Product, category, brand, banner CRUD
- Voucher management
- Order status management
- User management

## 2. Tech Stack

### Backend

- Java 17
- Spring Boot 4.0.1
- Spring Web MVC, Spring Security, Spring Data JPA
- OAuth2 Client
- SQL Server + Hibernate
- JWT (jjwt)
- Thymeleaf (legacy/server-rendered parts)
- Spring Mail

### Frontend

- React 19
- Vite 8
- React Router
- Axios
- Chart.js

## 3. Repository Structure

```text
argaty/
|- src/main/java/com/argaty      # Spring Boot source
|- src/main/resources            # application.properties, templates, static
|- scripts/update-products.sql   # Utility SQL script for feature flags
|- FE/                           # React + Vite frontend
|  |- src/
|  |- package.json
|  |- vite.config.js
|- pom.xml
|- README.md
```

## 4. Prerequisites

- Java 17+
- Maven 3.9+
- Node.js 20+ (recommended)
- npm 10+
- SQL Server (local or remote)

## 5. Quick Start (Local)

## 5.1 Clone project

```powershell
git clone <your-repository-url>
cd argaty
```

## 5.2 Create database

Create SQL Server database, for example:

```sql
CREATE DATABASE ArgatyDB;
```

## 5.3 Configure backend

Update `src/main/resources/application.properties` or override by environment variables.

Minimal required values:

```properties
spring.datasource.url=jdbc:sqlserver://localhost:1433;databaseName=ArgatyDB;encrypt=true;trustServerCertificate=true
spring.datasource.username=sa
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=update
```

## 5.4 Run backend

```powershell
./mvnw spring-boot:run
```

Backend runs at: `http://localhost:8080`

## 5.5 Run frontend

Open new terminal:

```powershell
cd FE
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

Vite proxy is already configured:

- `/api -> http://localhost:8080`
- `/uploads -> http://localhost:8080`

## 6. Build Commands

### Backend

```powershell
./mvnw clean package
```

Artifact output:

- `target/Argaty-0.0.1-SNAPSHOT.jar`

Run packaged jar:

```powershell
java -jar target/Argaty-0.0.1-SNAPSHOT.jar
```

### Frontend

```powershell
cd FE
npm run build
npm run preview
```

## 7. Environment Variables (Recommended)

Do not hardcode secrets in production. Prefer environment variables.

### 7.1 Mail

- `MAIL_USERNAME`
- `MAIL_PASSWORD`
- `MAIL_FROM`
- `APP_CONTACT_TO`

### 7.2 URL config

- `APP_BASE_URL` (backend base URL, default: `http://localhost:8080`)
- `APP_FRONTEND_URL` (frontend URL, default: `http://localhost:5173`)

### 7.3 OAuth2 social login

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `FACEBOOK_CLIENT_ID`
- `FACEBOOK_CLIENT_SECRET`

### 7.4 JWT and security

- `APP_SECURITY_JWT_SECRET`
- `APP_SECURITY_JWT_ACCESS_TOKEN_EXPIRY_MINUTES`
- `APP_SECURITY_JWT_REFRESH_TOKEN_EXPIRY_DAYS`

### 7.5 Admin bootstrap

- `APP_ADMIN_BOOTSTRAP_ENABLED`
- `APP_ADMIN_BOOTSTRAP_EMAIL`
- `APP_ADMIN_BOOTSTRAP_PASSWORD`
- `APP_ADMIN_BOOTSTRAP_FULL_NAME`

### 7.6 Payment providers

- Bank transfer:
  - `PAYMENT_BANK_ENABLED`
  - `PAYMENT_BANK_CODE`
  - `PAYMENT_BANK_ACCOUNT_NO`
  - `PAYMENT_BANK_ACCOUNT_NAME`
- MoMo:
  - `PAYMENT_MOMO_ENABLED`
  - `PAYMENT_MOMO_PARTNER_CODE`
  - `PAYMENT_MOMO_ACCESS_KEY`
  - `PAYMENT_MOMO_SECRET_KEY`
- ZaloPay:
  - `PAYMENT_ZALOPAY_ENABLED`
  - `PAYMENT_ZALOPAY_APP_ID`
  - `PAYMENT_ZALOPAY_KEY1`
  - `PAYMENT_ZALOPAY_KEY2`

### 7.7 Shipping (GHN)

- `SHIPPING_PRIMARY_PROVIDER`
- `GHN_ENABLED`
- `GHN_API_URL`
- `GHN_TOKEN`
- `GHN_SHOP_ID`
- `GHN_ORIGIN_CITY`
- `GHN_ORIGIN_DISTRICT`

## 8. OAuth Redirect URIs

When configuring Google/Facebook apps in developer console, set redirect URI to backend endpoint (example local):

- `http://localhost:8080/login/oauth2/code/google`
- `http://localhost:8080/login/oauth2/code/facebook`

## 9. API Overview

Frontend uses REST APIs under:

- Base: `/api/v1`
- Main groups:
  - `/auth`
  - `/products`, `/home`, `/newsletter`
  - `/checkout`, `/payments`
  - `/profile`, `/orders`, `/addresses`, `/wishlist`
  - `/admin/*`

## 10. Utility SQL Script

File:

- `scripts/update-products.sql`

Purpose:

- Mark featured/new/best-seller products
- Mark featured categories

Run this script after sample data import if home page sections are empty.

## 11. Notes for Production

- Set `spring.jpa.show-sql=false`
- Set `server.error.include-stacktrace=never`
- Move all secrets to environment or secret manager
- Set secure CORS and trusted origins
- Use strong JWT secret and rotate periodically
- Disable admin bootstrap after first deployment

## 12. Troubleshooting

### Backend cannot connect to DB

- Verify SQL Server is running
- Verify username/password and port `1433`
- Verify database exists (`ArgatyDB`)

### Frontend cannot call API

- Check backend is running on `8080`
- Check FE is running on `5173`
- Check `FE/vite.config.js` proxy config

### Social login fails

- Check client id/secret
- Check redirect URI configured exactly
- Check backend base URL and frontend URL env vars

### Uploaded images not showing

- Ensure `/uploads` folder exists and backend has read permission
- Ensure Vite proxy for `/uploads` is active in dev

## 13. Development Workflow

1. Start backend (`./mvnw spring-boot:run`)
2. Start frontend (`cd FE && npm run dev`)
3. Implement feature
4. Validate:
   - Backend compile/test
   - Frontend build (`npm run build`)

## 14. License

This project is currently used for internal/educational development.
Add your license terms here (MIT/Apache-2.0/etc.) before public distribution.

## 15. Huong Dan Nhanh (Tieng Viet)

### 15.1 Chay local nhanh

1. Tao database SQL Server: `ArgatyDB`
2. Sua `src/main/resources/application.properties`:
   - `spring.datasource.url`
   - `spring.datasource.username`
   - `spring.datasource.password`
3. Chay backend:

```powershell
./mvnw spring-boot:run
```

4. Chay frontend:

```powershell
cd FE
npm install
npm run dev
```

5. Truy cap:
   - Backend: `http://localhost:8080`
   - Frontend: `http://localhost:5173`

### 15.2 Bien moi truong nen cau hinh

- Mail: `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`
- URL: `APP_BASE_URL`, `APP_FRONTEND_URL`
- OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`
- JWT: `APP_SECURITY_JWT_SECRET`
- Thanh toan: nhom bien `PAYMENT_*`
- Van chuyen: nhom bien `GHN_*`

### 15.3 Luu y trien khai

- Khong commit secret, token, mat khau vao repository
- Tat SQL log va stacktrace chi tiet tren production
- Doi JWT secret sang chuoi dai, ngau nhien
- Tat admin bootstrap sau lan khoi tao dau tien

## 16. API Examples (Local)

Base URL (backend):

```text
http://localhost:8080/api/v1
```

### 16.1 Login

Request:

```bash
curl -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "123123",
    "rememberMe": true
  }'
```

Typical success response shape:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "id": 1,
    "fullName": "Nguyen Van A",
    "email": "user@example.com",
    "role": "USER"
  }
}
```

### 16.2 Refresh token

```bash
curl -X POST "http://localhost:8080/api/v1/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your-refresh-token"
  }'
```

### 16.3 List products

```bash
curl "http://localhost:8080/api/v1/products?page=1&size=12&keyword=keyboard&sort=newest"
```

### 16.4 Product detail by slug

```bash
curl "http://localhost:8080/api/v1/products/slug/logitech-g-pro-x-superlight"
```

### 16.5 Checkout preview (Bearer token required)

```bash
curl "http://localhost:8080/api/v1/checkout/preview?addressId=1&voucherCode=SALE10" \
  -H "Authorization: Bearer your-access-token"
```

### 16.6 Place order (Bearer token required)

```bash
curl -X POST "http://localhost:8080/api/v1/checkout/place-order" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-access-token" \
  -d '{
    "paymentMethod": "COD",
    "addressId": 1,
    "voucherCode": "SALE10",
    "note": "Giao gio hanh chinh"
  }'
```

### 16.7 Upload avatar (Bearer token required)

```bash
curl -X POST "http://localhost:8080/api/v1/files/upload/avatar" \
  -H "Authorization: Bearer your-access-token" \
  -F "file=@D:/images/avatar.png"
```

### 16.8 Admin product list (ADMIN token required)

```bash
curl "http://localhost:8080/api/v1/admin/products?page=1&size=20" \
  -H "Authorization: Bearer your-admin-access-token"
```

Note:

- In frontend dev mode, call APIs via Vite proxy paths (`/api/...`) instead of hardcoding backend domain.
- Frontend axios base path is `/api/v1` in `FE/src/services/apiClient.js`.
#   A r g a t y 
 
 