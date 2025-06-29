# Student ID Check-in API

Simple check-in API that only requires a student ID - no password or authentication needed!

---

## 🎯 **New Simple Check-in Endpoints**

### POST /api/student/check-in
**Purpose**: Check-in using only student ID (no authentication required)

**Request Body**:
```json
{
  "student_id": "12345",
  "full_name": "John Doe",     // Optional - for first-time registration
  "timestamp": "2025-06-29T12:00:00Z"  // Optional - defaults to current time
}
```

**Success Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "12345",
    "user_id": "uuid-here",
    "checked_in_at": "2025-06-29T12:00:00Z",
    "next_check_in_available": "2025-06-29T16:00:00Z"
  },
  "message": "Check-in recorded successfully for student 12345"
}
```

**Error Responses**:

**400 - Too Soon (4-hour cooldown)**:
```json
{
  "success": false,
  "error": "CHECK_IN_TOO_SOON",
  "message": "Student 12345 can check-in again at 2025-06-29T16:00:00Z",
  "next_available": "2025-06-29T16:00:00Z"
}
```

**400 - Missing Student ID**:
```json
{
  "success": false,
  "error": "MISSING_STUDENT_ID",
  "message": "student_id is required in request body"
}
```

---

### POST /api/student/check-ins
**Purpose**: Get student's check-in history using student ID

**Request Body**:
```json
{
  "student_id": "12345",
  "limit": 10,        // Optional - default 10, max 100
  "offset": 0         // Optional - default 0
}
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "check_ins": [
      {
        "id": "12345",
        "checked_in_at": "2025-06-29T12:00:00Z"
      },
      {
        "id": "12346", 
        "checked_in_at": "2025-06-29T08:00:00Z"
      }
    ],
    "total": 15,
    "next_check_in_available": "2025-06-29T16:00:00Z"
  }
}
```

**404 - Student Not Found**:
```json
{
  "success": false,
  "error": "STUDENT_NOT_FOUND", 
  "message": "Student with ID '12345' not found"
}
```

---

### POST /api/student/register
**Purpose**: Pre-register a student (optional - auto-registration happens on first check-in)

**Request Body**:
```json
{
  "student_id": "12345",
  "full_name": "John Doe"    // Optional
}
```

**Success Response** (201):
```json
{
  "success": true,
  "data": {
    "student_id": "12345",
    "user_id": "uuid-here"
  },
  "message": "Student 12345 registered successfully"
}
```

**409 - Student Already Exists**:
```json
{
  "success": false,
  "error": "STUDENT_EXISTS",
  "message": "Student with ID '12345' already exists"
}
```

---

## 🧪 **API Testing Examples**

### **1. Simple Check-in (Auto-registration)**
```bash
curl -X POST http://localhost:3000/api/student/check-in \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "12345",
    "full_name": "John Doe"
  }'
```

### **2. Check-in for Existing Student**
```bash
curl -X POST http://localhost:3000/api/student/check-in \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "12345"
  }'
```

### **3. Get Check-in History**
```bash
curl -X POST http://localhost:3000/api/student/check-ins \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "12345",
    "limit": 5
  }'
```

### **4. Pre-register Student**
```bash
curl -X POST http://localhost:3000/api/student/register \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "12345",
    "full_name": "John Doe"
  }'
```

---

## 🔄 **Auto-Registration Flow**

**First Check-in**:
1. Student checks in with `student_id: "12345"`
2. System doesn't find student → auto-registers them
3. Creates user account in background
4. Records check-in
5. Returns success

**Subsequent Check-ins**:
1. Student checks in with `student_id: "12345"`
2. System finds existing student
3. Checks 4-hour cooldown
4. Records check-in if allowed

---

## ✨ **Key Benefits**

- ✅ **No passwords required** - just student ID
- ✅ **Auto-registration** - students don't need to sign up
- ✅ **4-hour cooldown** - prevents gaming the system  
- ✅ **Simple integration** - easy for any client app
- ✅ **History tracking** - full check-in history per student
- ✅ **Error handling** - clear error messages

---

## 🔒 **Security Notes**

- Student IDs should be unique and hard to guess
- Consider adding rate limiting to prevent spam
- System logs all check-ins for audit trail
- No authentication means anyone can check-in for any student ID
- For production, consider adding device registration or basic auth

---

## 🚀 **Migration from Old API**

**Old API** (JWT required):
```bash
POST /api/check-in
Authorization: Bearer <jwt_token>
```

**New API** (student ID only):
```bash  
POST /api/student/check-in
Content-Type: application/json
{ "student_id": "12345" }
```

Both APIs work simultaneously - choose based on your needs!