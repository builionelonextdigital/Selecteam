# 📚 Project Structure - Selecteam

Toàn bộ cấu trúc và mô tả các file trong dự án.

## 📁 Cấu Trúc Dự Án

```
Selecteam/
├── 📄 package.json              # Dependencies & scripts
├── 📄 .env                      # Environment variables (DB connection)
├── 📄 .gitignore               # Git ignore rules
├── 📄 server.js                # Express server & main logic
├── 📄 config.js                # Configuration settings
├── 📄 setup-db.js              # Database setup script
├── 📄 test-api.js              # API testing script
│
├── 📁 views/
│   └── 📄 form.ejs             # HTML form template
│
├── 📁 Docker/
│   ├── 📄 Dockerfile           # Docker image config
│   └── 📄 docker-compose.yml   # Docker compose setup
│
├── 📚 Documentation/
│   ├── 📄 README.md            # Main documentation
│   ├── 📄 QUICK_START.md       # Quick setup guide
│   ├── 📄 API_DOCUMENTATION.md # API endpoints
│   ├── 📄 DEPLOYMENT_GUIDE.md  # Deployment options
│   ├── 📄 EXTENDED_FEATURES.md # Advanced features
│   └── 📄 PROJECT_STRUCTURE.md # File structure (file này)
│
└── 📁 .git/
    └── Git repository
```

## 📄 File Details

### 1. **package.json**
- Định nghĩa dependencies (express, pg, ejs, dotenv)
- Scripts để chạy server, dev, setup, test
- Metadata dự án

### 2. **.env**
- PostgreSQL connection string
- Server port
- **⚠️ Không commit file này**

### 3. **.gitignore**
- Danh sách file không đẩy lên git
- `node_modules/`, `.env`, logs, v.v.

### 4. **server.js** ⭐ (File chính)
Chứa:
- Express server setup
- PostgreSQL connection pool
- Routes: GET `/`, POST `/submit`, GET `/api/selections`
- Database initialization
- Validation logic
- Team selection logic (max 2 people/team)

### 5. **config.js**
Configuration file cho dễ bảo trì:
- Teams data
- Giới hạn người/team
- Validation rules
- Messages

### 6. **setup-db.js**
Script để setup database thủ công:
- Tạo bảng team_selections
- Tạo index
- Hiển thị schema
- Hiển thị dữ liệu hiện tại

**Dùng:**
```bash
npm run setup-db
```

### 7. **test-api.js**
Script để test API:
- Gửi form data
- Test validation
- Lấy danh sách
- Kiểm tra error handling

**Dùng:**
```bash
npm run test
```

### 8. **views/form.ejs**
HTML form template (EJS):
- Bootstrap responsive design
- Real-time validation
- Team status display
- Form submission

**Features:**
- Hiển thị số người/team
- Disable option khi team đầy
- Responsive design
- Tiếng Việt

## 🚀 Quick Commands

```bash
# Install dependencies
npm install

# Start server (production)
npm start

# Start server (development with auto-reload)
npm run dev

# Setup database
npm run setup-db

# Test API
npm run test

# View logs
npm run dev

# Build Docker image
docker build -t selecteam .

# Run with Docker
docker-compose up
```

## 🗄️ Database Schema

**Bảng: `team_selections`**

```sql
CREATE TABLE team_selections (
  id SERIAL PRIMARY KEY,           -- Auto-increment ID
  name VARCHAR(255) NOT NULL,      -- User name
  team VARCHAR(50) NOT NULL,       -- Team: team_a, team_b, team_c, team_d
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- Creation time
);

-- Index for faster queries
CREATE INDEX idx_team ON team_selections(team);
```

## 🔌 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Form page |
| POST | `/submit` | Submit selection |
| GET | `/api/selections` | Get all selections (JSON) |

## 🎯 Main Features

✅ **Form**
- Tên input field
- Team select dropdown
- Validation

✅ **Teams**
- 4 teams (A, B, C, D)
- Status display (X/2)
- Disable when full

✅ **Validation**
- Max 2 people per team
- Server-side checks
- Error messages (tiếng Việt)

✅ **Database**
- PostgreSQL (Neon)
- Auto-initialization
- Index optimization

✅ **API**
- Form submission
- JSON export
- Real-time team counts

## 🎨 Technology Stack

| Tech | Version | Purpose |
|------|---------|---------|
| Node.js | 14+ | Runtime |
| Express | 4.18 | Web framework |
| PostgreSQL | 12+ | Database |
| EJS | 3.1 | Template engine |
| pg | 8.11 | DB driver |
| dotenv | 16.3 | Environment vars |

## 🔒 Environment Variables

```env
DATABASE_URL=postgresql://user:pass@host/db
PORT=3000
NODE_ENV=development
```

## 📊 Usage Flow

```
1. User visits http://localhost:3000
   ↓
2. Server loads form with team status
   ↓
3. User enters name & selects team
   ↓
4. Submit form
   ↓
5. Server validates:
   - Name not empty ✓
   - Team valid ✓
   - Team not full ✓
   ↓
6. Insert into database
   ↓
7. Show success message
   ↓
8. Update team status on form
```

## 🧪 Testing

**Test API endpoints:**
```bash
npm run test
```

**Manual testing:**
```bash
# Get form
curl http://localhost:3000/

# Submit form
curl -X POST http://localhost:3000/submit \
  -d "name=Test User&team=team_a"

# Get selections
curl http://localhost:3000/api/selections | jq
```

## 📝 Common Tasks

### Change Team Count
Edit `server.js`:
```javascript
const MAX_PEOPLE_PER_TEAM = 2;  // Change to 3, 4, etc.
```

### Add New Team
Edit `server.js`:
```javascript
const TEAMS = [
  // ... existing teams
  { id: 5, name: 'Team E', value: 'team_e' }
];
```

### Change Database
Edit `.env`:
```env
DATABASE_URL=postgresql://new-user:new-pass@new-host/new-db
```

### Change Port
```bash
PORT=5000 npm start
```

## 🔍 Debugging

**Enable detailed logs:**
```javascript
// In server.js
console.log('SQL Query:', query);
console.log('Result:', result);
```

**Database debugging:**
```bash
npm run setup-db  # Shows current database state
```

**API testing:**
```bash
npm run test
```

## 📈 Performance Optimization

✅ Index on `team` column for fast queries
✅ Connection pooling for database
✅ EJS template caching
✅ Static asset optimization

## 🔐 Security Features

✅ SQL injection prevention (parameterized queries)
✅ Input validation (server-side)
✅ Environment variables for secrets
✅ No sensitive data in frontend

## 🚀 Deployment Checklist

- [ ] Install Node.js 14+
- [ ] Configure `.env`
- [ ] Run `npm install`
- [ ] Run `npm run setup-db` (setup database)
- [ ] Test with `npm run test`
- [ ] Start with `npm start`
- [ ] Setup reverse proxy (Nginx)
- [ ] Configure SSL certificate
- [ ] Setup monitoring/logs

---

**Tham khảo thêm:**
- [README.md](README.md) - Tài liệu chính
- [QUICK_START.md](QUICK_START.md) - Bắt đầu nhanh
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Chi tiết API
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Hướng dẫn deploy
- [EXTENDED_FEATURES.md](EXTENDED_FEATURES.md) - Tính năng nâng cao
