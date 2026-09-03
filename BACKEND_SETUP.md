# Backend Setup Guide - Museum Ticket Booking

## Prerequisites
- Java 17+ (Java 21 recommended)
- PostgreSQL 12+
- Maven 3.6+

## Step 1: Create PostgreSQL Database

Open PostgreSQL command prompt and run:

```bash
# Login to PostgreSQL
psql -U postgres

# Then run the setup script
psql -U postgres -f "c:\ticket-booking\DATABASE_SETUP.sql"
```

Or in PowerShell:
```powershell
# Create database directly
psql -U postgres -c "CREATE DATABASE museum_db;"
```

## Step 2: Build Backend

```powershell
cd c:\ticket-booking\backend
mvn clean install -DskipTests
```

## Step 3: Run Backend

### Option A: Using Maven (recommended for development)
```powershell
cd c:\ticket-booking\backend
mvn spring-boot:run
```

### Option B: Using Java JAR (production-like)
```powershell
java -jar c:\ticket-booking\backend\target\ticket-booking-1.0.0.jar
```

## Step 4: Verify Backend is Running

Visit: `http://localhost:9090/api/museums`

If you see a response, the backend is running! ✅

## Database Configuration

**File**: `c:\ticket-booking\backend\src\main\resources\application.properties`

Current settings:
- **Database**: PostgreSQL
- **Host**: localhost:5432
- **Database Name**: museum_db
- **Username**: postgres
- **Password**: postgres
- **Auto Schema**: Creates tables automatically on first run

## Common Issues

### 1. "FATAL: database 'museum_db' does not exist"
- **Fix**: Create database using the commands above

### 2. "FATAL: role 'postgres' does not exist"  
- **Fix**: Change password in `application.properties` or use correct PostgreSQL user

### 3. "Connection refused" on localhost:5432
- **Fix**: Make sure PostgreSQL service is running
  ```powershell
  # Check if running
  Get-Process postgres
  
  # Start PostgreSQL service (Windows)
  net start postgresql-x64-15
  ```

### 4. Error on startup: "Failed to bind to port 9090"
- **Fix**: Port 9090 is already in use. Either:
  - Kill the process using port 9090
  - Change port in `application.properties`: `server.port=9091`

## API Health Check

Once running, you can test these endpoints:

```bash
# Check all museums
curl http://localhost:9090/api/museums

# Check if running  
curl http://localhost:9090/health
```

## Next Steps

1. ✅ Backend running on http://localhost:9090
2. ⏳ Start Frontend (React/Vite)
3. ⏳ Configure payment gateway (Razorpay)
4. ⏳ Set up email notifications

---

**Last Updated**: March 26, 2026
**Backend Version**: 1.0.0
