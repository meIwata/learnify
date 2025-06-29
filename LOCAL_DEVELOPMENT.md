# Local Development Setup

Complete guide to run Learnify backend with local Supabase instance and auto-registration API.

---

## 🏠 **Part 1: Install Supabase CLI**

### **1. Install Supabase CLI**
```bash
# Using npm (recommended)
npm install -g supabase

# OR using Homebrew (macOS)
brew install supabase/tap/supabase

# Verify installation
supabase --version
```

### **2. Login to Supabase**
```bash
supabase login
```
Follow the browser authentication flow.

---

## 🗄️ **Part 2: Initialize Local Supabase**

### **1. Setup Supabase in Backend Folder**
```bash
# Go to backend directory
cd backend

# Initialize Supabase project
supabase init
```

This creates:
```
backend/
├── supabase/
│   ├── config.toml         # Supabase configuration
│   ├── seed.sql           # Initial data
│   └── migrations/        # Database migrations
├── src/
└── ...
```

### **2. Start Local Supabase**
```bash
# Start all Supabase services (takes ~2 minutes first time)
supabase start
```

**Expected output:**
```
Started supabase local development setup.

         API URL: http://localhost:54321
     GraphQL URL: http://localhost:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**🎉 Save these values!** You'll need them for your `.env` file.

---

## 🔧 **Part 3: Configure Backend for Local Development**

### **1. Update Environment Variables**
The repository already includes:
- `backend/.env.local` - **Local development** (localhost Supabase)
- `backend/.env` - **Production deployment** (Supabase cloud)

For local development, ensure `backend/.env.local` contains:

```bash
# Local Supabase Configuration
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Server Configuration
PORT=3000
NODE_ENV=local
CHECK_IN_COOLDOWN_HOURS=4
```

**Note**: The `.env` file is configured for production with Supabase cloud. Always use `npm run dev:local` for local development.

### **2. Database Schema (Current Implementation)**
The current auto-registration system uses this schema:

```sql
-- Students table - Auto-registration support
CREATE TABLE students (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id text UNIQUE NOT NULL,
    full_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Student check-ins table - Check-in tracking
CREATE TABLE student_check_ins (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    student_id text NOT NULL,
    student_uuid uuid REFERENCES students(id),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Performance indexes
CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_student_check_ins_student_id ON student_check_ins(student_id);
CREATE INDEX idx_student_check_ins_created ON student_check_ins(created_at DESC);
```

The migration file is already created at `supabase/migrations/20250629102903_simplified_student_checkins.sql`.

### **3. Apply Migration**
```bash
# Apply migrations to local database
supabase db reset
```

---

## 🚀 **Part 4: Development Workflow**

### **1. Start Development Environment**
```bash
# Terminal 1: Start Supabase (if not already running)
cd backend
npm run supabase:start

# Terminal 2: Start Backend Server (local Supabase)
npm run dev:local

# OR: Start Backend Server (remote Supabase)
npm run dev
```

### **2. Access Local Services**
- **Backend API**: http://localhost:3000
- **Supabase Studio**: http://localhost:54323 (Database admin UI)
- **Database**: postgresql://postgres:postgres@localhost:54322/postgres

### **3. No User Setup Required**
The current auto-registration system doesn't require pre-creating users. Students are automatically created on their first check-in.

---

## 🧪 **Part 5: Testing the Auto-Registration API**

### **1. Test Student Check-in (Auto-Registration)**
```bash
# Test auto-registration check-in for new student
curl -X POST http://localhost:3000/api/auto/check-in \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "ALICE2025",
    "full_name": "Alice Johnson"
  }'

# Expected response:
# {
#   "success": true,
#   "data": {
#     "check_in_id": 1,
#     "student_id": "ALICE2025",
#     "student_name": "Alice Johnson",
#     "checked_in_at": "2025-06-29T10:33:06.122Z",
#     "is_new_student": true
#   },
#   "message": "Check-in recorded for Alice Johnson"
# }
```

### **2. Test Additional Check-ins**
```bash
# Test second check-in (no cooldown)
curl -X POST http://localhost:3000/api/auto/check-in \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "ALICE2025"
  }'

# Test another student
curl -X POST http://localhost:3000/api/auto/check-in \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "BOB2025",
    "full_name": "Bob Smith"
  }'
```

### **3. Test History and Admin APIs**
```bash
# Get student's check-in history
curl http://localhost:3000/api/auto/check-ins/ALICE2025

# Get all students (admin view)
curl http://localhost:3000/api/auto/students

# Health check
curl http://localhost:3000/health
```

---

## 🛠️ **Useful Commands**

### **Supabase Commands**
```bash
# Start local Supabase
supabase start

# Stop local Supabase
supabase stop

# Reset database (applies all migrations)
supabase db reset

# View logs
supabase logs

# Generate TypeScript types
supabase gen types typescript --local > src/types/supabase.ts

# Create new migration
supabase migration new migration_name

# View current status
supabase status
```

### **Backend Commands**
```bash
# Development with local Supabase
npm run dev:local

# Development with remote Supabase
npm run dev

# Build TypeScript
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

---

## 📁 **Updated Project Structure**

```
backend/
├── supabase/
│   ├── config.toml              # Supabase local config
│   ├── seed.sql                 # Initial data
│   └── migrations/              # Database migrations
│       └── 20250629102903_simplified_student_checkins.sql
├── src/
│   ├── config/supabase.ts       # Environment-specific config
│   ├── routes/autoCheckIn.ts    # Auto-registration endpoints
│   ├── routes/health.ts         # Health check endpoint
│   └── ...
├── .env                         # Default environment (remote Supabase)
├── .env.local                   # Local development
├── .env.example                 # Template
└── package.json
```

---

## 🔄 **Environment Management**

Update `backend/src/config/supabase.ts` to handle different environments:

```typescript
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment-specific config
const envFile = process.env.NODE_ENV === 'local' ? '.env.local' : '.env';
dotenv.config({ path: envFile });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  throw new Error(
    `Missing Supabase environment variables. Check your ${envFile} file.`
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const config = {
  checkInCooldownHours: parseInt(process.env.CHECK_IN_COOLDOWN_HOURS || '4', 10),
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isLocal: supabaseUrl?.includes('localhost')
};
```

---

## ✅ **Benefits of Local Development**

- ✅ **Faster**: No network latency
- ✅ **Offline**: Work without internet
- ✅ **Safe**: Test destructive operations safely
- ✅ **Free**: No API usage costs
- ✅ **Reset**: Easy to reset database state
- ✅ **Migration Testing**: Test schema changes locally first
- ✅ **Auto-Registration**: Test student registration flow without affecting production data

---

## 🚨 **Troubleshooting**

**❌ "Port already in use"**
```bash
supabase stop
supabase start
```

**❌ "Docker not running"**
- Start Docker Desktop
- Run `supabase start` again

**❌ "Migration failed"**
```bash
# Check migration syntax
supabase db reset --debug
```

**❌ "Can't connect to local Supabase"**
- Verify `supabase status` shows all services running
- Check `.env.local` has correct localhost URLs

Now you have a complete local development setup! 🎉