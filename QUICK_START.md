# Quick Start - Run Locally

## Option 1: Docker Compose (Recommended - Easiest)

```bash
# Start all services (database, backend, frontend)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**Access the application:**
- Frontend: http://localhost:8080
- Backend API: http://localhost:3000
- Backend Metrics: http://localhost:9090/metrics
- Backend Health: http://localhost:3000/health

**First Steps:**
1. Open http://localhost:8080
2. Click "Sign Up"
3. Register with:
   - Email: test@platform.com
   - Password: password123
   - Name: Test User
   - Tenant: Platform Team
4. Create your first task!

## Option 2: Manual Setup (Without Docker for Frontend/Backend)

### 1. Start Database Only

```bash
docker-compose up -d postgres

# Wait for database to be ready (about 10 seconds)
# Migrations will run automatically
```

### 2. Start Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=taskdb
DB_USER=taskuser
DB_PASSWORD=changeme
JWT_SECRET=local-dev-secret-key
METRICS_ENABLED=true
EOF

# Start backend
npm run dev
```

Backend will run on: http://localhost:3000

### 3. Start Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start frontend
npm run dev
```

Frontend will run on: http://localhost:5173

## Verify Everything is Working

### Check Backend

```bash
# Health check
curl http://localhost:3000/health

# Should return:
# {"status":"healthy","timestamp":"...","uptime":...,"database":"connected"}
```

### Check Frontend

Open http://localhost:8080 (or http://localhost:5173 if manual) in your browser.

### Check Database

```bash
# Connect to database
docker-compose exec postgres psql -U taskuser -d taskdb

# List tenant schemas
\dn

# View platform tenant users
SET search_path TO tenant_platform;
SELECT * FROM users;
```

## Troubleshooting

### Port Already in Use

If port 3000, 5432, or 8080 is already in use:

**Windows:**
```powershell
# Find process using port
netstat -ano | findstr :3000

# Kill process (replace <PID> with actual process ID)
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9
```

### Backend Can't Connect to Database

1. Check PostgreSQL is running: `docker ps | grep postgres`
2. Verify database credentials in `.env` file
3. Check backend logs: `docker-compose logs backend`

### Frontend Can't Connect to Backend

1. Verify backend is running: `curl http://localhost:3000/health`
2. Check browser console for CORS errors
3. Verify `VITE_API_URL` in frontend (should be `http://localhost:3000` for manual setup)

### Database Migrations Not Running

Migrations run automatically when PostgreSQL starts. If tables don't exist:

```bash
# Manually run migrations
docker-compose exec postgres psql -U taskuser -d taskdb -f /docker-entrypoint-initdb.d/001_create_tenants.sql
docker-compose exec postgres psql -U taskuser -d taskdb -f /docker-entrypoint-initdb.d/002_create_users.sql
docker-compose exec postgres psql -U taskuser -d taskdb -f /docker-entrypoint-initdb.d/003_create_tasks.sql
```

## Development Tips

- **Hot Reload**: Both backend (nodemon) and frontend (Vite) support hot reload
- **View Logs**: `docker-compose logs -f` to see all logs
- **Reset Database**: `docker-compose down -v` (removes all data)
- **Restart Services**: `docker-compose restart backend frontend`

## Next Steps

Once running locally:
1. Test user registration and login
2. Create tasks in different tenants
3. Verify tenant isolation
4. Check resource usage display
5. Test API endpoints

For deployment to EKS, see [CI_CD_SETUP.md](CI_CD_SETUP.md).
