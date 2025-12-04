# Quick Start Guide

Get the application running locally in minutes.

## 🚀 Option 1: Docker Compose (Recommended)

**Start all services:**
```bash
docker-compose up -d
```

**Access:**
- Frontend: http://localhost:8080
- Backend API: http://localhost:3000
- Health Check: http://localhost:3000/health
- Metrics: http://localhost:9090/metrics

**Stop services:**
```bash
docker-compose down
```

**View logs:**
```bash
docker-compose logs -f
```

## 🛠️ Option 2: Manual Setup

### 1. Start Database
```bash
docker-compose up -d postgres
# Wait ~10 seconds for migrations to complete
```

### 2. Start Backend
```bash
cd backend
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

npm run dev
```

Backend: http://localhost:3000

### 3. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

## ✅ Verify Setup

### Backend Health
```bash
curl http://localhost:3000/health
curl http://localhost:3000/health/ready
```

### Database Connection
```bash
docker-compose exec postgres psql -U taskuser -d taskdb -c "SELECT * FROM tenants;"
```

### Frontend
Open http://localhost:8080 (or http://localhost:5173) in browser.

## 🔧 Troubleshooting

### Port Already in Use

**Windows:**
```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
lsof -ti:3000 | xargs kill -9
```

### Database Connection Issues

1. Check PostgreSQL is running: `docker ps | grep postgres`
2. Verify credentials in `.env` file
3. Check logs: `docker-compose logs backend`

### Migrations Not Running

Manually run migrations:
```bash
docker-compose exec postgres psql -U taskuser -d taskdb -f /docker-entrypoint-initdb.d/001_create_tenants.sql
docker-compose exec postgres psql -U taskuser -d taskdb -f /docker-entrypoint-initdb.d/002_create_users.sql
docker-compose exec postgres psql -U taskuser -d taskdb -f /docker-entrypoint-initdb.d/003_create_tasks.sql
```

## 💡 Development Tips

- **Hot Reload**: Both backend and frontend support hot reload
- **View Logs**: `docker-compose logs -f [service]`
- **Reset Database**: `docker-compose down -v`
- **Restart Service**: `docker-compose restart [service]`

## 📚 Next Steps

- [README.md](README.md) - Full documentation
- [CI_CD_SETUP.md](CI_CD_SETUP.md) - CI/CD pipeline configuration
- [database/README.md](database/README.md) - Database details
- [Gitops-pipeline](https://github.com/SaaSInfraLab/Gitops-pipeline) - GitOps deployment configuration
