# Deployment Guide

Step-by-step deployment of Learnify backend with auto-registration API to Supabase + Zeabur.

---

## 🗄️ **Part 1: Supabase Setup**

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click **"New Project"**
3. Choose organization → Enter project name: `learnify`
4. Set database password (save it!)
5. Choose region closest to users
6. Click **"Create new project"** (takes ~2 minutes)

### 2. Set Up Database Schema
1. Go to **SQL Editor** in Supabase dashboard
2. Run this SQL to create the auto-registration schema:

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

**Alternative:** You can also push the migration from your local setup:
```bash
# Link to remote Supabase project
supabase link --project-ref your-project-id

# Push local migrations to remote
supabase db push
```

### 3. Get API Keys
1. Go to **Settings** → **API**
2. Copy these values (save them!):
   - `Project URL` 
   - `anon public` key
   - `service_role` key (keep secret!)

---

## 🚀 **Part 2: Zeabur Deployment**

### 1. Prepare Repository
1. Push your code to GitHub:
```bash
git add .
git commit -m "Add backend implementation for deployment"
git push origin main
```

### 2. Deploy to Zeabur
1. Go to [zeabur.com](https://zeabur.com)
2. Sign in with GitHub
3. Click **"Create Project"**
4. Choose **"Deploy from GitHub"**
5. Select your `FCU` repository
6. Select **`backend/`** folder as root directory
7. Click **"Deploy"**

### 3. Configure Environment Variables
In Zeabur dashboard → **Environment** tab, add:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=3000
NODE_ENV=production
CHECK_IN_COOLDOWN_HOURS=4
```

**Important**: Replace the placeholder values with your actual Supabase cloud project credentials from Part 1, Step 3.

**Note**: The backend's `.env` file should also be updated with your Supabase cloud credentials before pushing to GitHub, as Zeabur may use these as fallback values.

### 4. Get Deployment URL
1. Go to **Domains** tab in Zeabur
2. Copy the auto-generated URL (e.g., `https://your-app.zeabur.app`)
3. Test: Visit `https://your-app.zeabur.app/health`

---

## ✅ **Part 3: Verification**

### 1. Test Health Endpoint
```bash
curl https://your-app.zeabur.app/health
```
Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-06-29T...",
  "service": "learnify-backend"
}
```

### 2. Test Auto-Registration API
```bash
# Test student auto-registration check-in
curl -X POST https://your-app.zeabur.app/api/auto/check-in \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "TEST2025",
    "full_name": "Test Student"
  }'

# Expected response:
# {
#   "success": true,
#   "data": {
#     "check_in_id": 1,
#     "student_id": "TEST2025",
#     "student_name": "Test Student",
#     "checked_in_at": "2025-06-29T10:00:00.000Z",
#     "is_new_student": true
#   },
#   "message": "Check-in recorded for Test Student"
# }

# Test getting student history
curl https://your-app.zeabur.app/api/auto/check-ins/TEST2025

# Test admin endpoint (get all students)
curl https://your-app.zeabur.app/api/auto/students
```

---

## 🔧 **Troubleshooting**

### Common Issues

**❌ Database Connection Error**
- Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Verify Supabase project is active
- Ensure `students` and `student_check_ins` tables exist

**❌ Build Failed on Zeabur**
```bash
# Run locally first to debug:
cd backend
npm install
npm run build
npm start
```

**❌ 500 Internal Server Error**
- Check Zeabur logs in dashboard
- Verify all environment variables are set
- Ensure auto-registration schema is deployed

**❌ Student Registration Failed**
- Check that `students` table has correct schema
- Verify `student_check_ins` table references are correct
- Test locally with same environment variables

### Quick Debug Commands
```bash
# Test locally
cd backend
npm run dev

# Check if Supabase connection works
node -e "
const { createClient } = require('@supabase/supabase-js');
const client = createClient('YOUR_URL', 'YOUR_KEY');
console.log('Supabase client created successfully');
"
```

---

## 📋 **Deployment Checklist**

- [ ] Supabase project created
- [ ] Auto-registration database schema deployed
- [ ] API keys copied and secured
- [ ] Code pushed to GitHub
- [ ] Zeabur project created and deployed
- [ ] Environment variables configured
- [ ] Health endpoint responding
- [ ] Auto-registration API tested successfully
- [ ] Domain URL noted for frontend integration

**🎉 Deployment complete!** Your backend with auto-registration API is now live and ready for frontend integration.