# 🛡️ WhyITshop Security Implementation Guide

## OWASP Top 10 (2021) Security Features

This backend implements comprehensive security measures to protect against the OWASP Top 10 vulnerabilities:

### ✅ Implemented Features

#### 1. **Rate Limiting** (OWASP A04: Insecure Design)
- Login endpoint: 5 attempts per 15 minutes
- General API: 30 requests per minute
- Returns `429 Too Many Requests` when limit exceeded

**Location:** `server.js` lines 83-106

```javascript
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts, try again later"
});

app.post("/api/auth/login", loginLimiter);
```

---

#### 2. **Account Lockout** (OWASP A04: Insecure Design)
- Automatically locks accounts after 5 failed login attempts
- Lock duration: 15 minutes
- Tracks via `failed_logins` table in Supabase

**Location:** `middleware/accountLockout.js`

**Setup Required:**
```sql
-- Run in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS failed_logins (
  email TEXT PRIMARY KEY,
  attempts INT DEFAULT 0,
  locked_until TIMESTAMP NULL,
  updated_at TIMESTAMP DEFAULT now()
);
```

---

#### 3. **CSRF Protection** (OWASP A08: Data Integrity Failures)
- Uses `csurf` middleware to protect forms
- Token endpoint: `GET /api/csrf-token`
- All POST/PUT/DELETE requests require CSRF token

**Location:** `server.js` lines 73-75 & 123-125

**Frontend Usage:**
```javascript
// Get CSRF token before form submission
const response = await fetch('/api/csrf-token');
const { csrfToken } = await response.json();

// Include in form data
const formData = new FormData();
formData.append('_csrf', csrfToken);
```

---

#### 4. **HTTPS Enforcement** (OWASP A02: Cryptographic Failures)
- Redirects HTTP → HTTPS in production
- HSTS Header: 1 year max-age
- Checks `x-forwarded-proto` header (for Vercel/proxies)

**Location:** `server.js` lines 36-46

```javascript
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (req.header("x-forwarded-proto") !== "https") {
      res.redirect(`https://${req.header("host")}${req.url}`);
    } else {
      next();
    }
  });
}
```

---

#### 5. **Security Headers** (OWASP A05: Security Misconfiguration)
- Content-Security-Policy (CSP)
- HTTP Strict-Transport-Security (HSTS)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection

**Location:** `server.js` lines 16-34 (Helmet.js)

---

#### 6. **Audit Logging** (OWASP A09: Security Logging & Monitoring)
- Logs all authentication events
- Logs all admin actions
- Logs data access with timestamps and IP addresses
- Stored in `audit_logs` table

**Location:** `middleware/auditLog.js`

**Setup Required:**
```sql
-- Run in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  user_id UUID NULL,
  details JSONB NULL,
  ip_address TEXT,
  created_at TIMESTAMP DEFAULT now()
);
```

---

#### 7. **Input Validation & Sanitization** (OWASP A03: Injection)
- Body parser limits: 10KB max
- Input sanitization utilities in `utils/sanitize.js`
- SQL injection prevention via Supabase parameterized queries
- XSS prevention via Content-Security-Policy

**Location:**
- `server.js` lines 61-62 (body parser limits)
- `frontend/src/utils/sanitize.js` (sanitization functions)

---

### 🚀 Installation & Setup

#### 1. Install Dependencies
```bash
cd Backend
npm install express-rate-limit csurf express-session
```

#### 2. Set Environment Variables
Copy `.env.example` to `.env` and fill in values:
```bash
cp .env.example .env
```

Edit `.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key
SESSION_SECRET=generate-32-char-random-string
NODE_ENV=development
```

#### 3. Create Database Tables
Run the SQL schema in Supabase:

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `SECURITY_SCHEMA.sql`
3. Run the SQL queries
4. Verify tables appear in your database

#### 4. Update userRoutes.js (if needed)
Ensure audit logging is imported:

```javascript
import { logAdminAction } from "../middleware/auditLog.js";
```

---

### 📊 Testing Security Features

#### Test Rate Limiting
```bash
# Try logging in 6 times rapidly
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test"}'
done
# 6th request should return 429
```

#### Test CSRF Protection
```bash
# Get CSRF token
curl http://localhost:5000/api/csrf-token

# Use token in POST request
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test","_csrf":"token-here"}'
```

#### Test Account Lockout
```bash
# Make 5 failed login attempts
# 6th attempt should return 403 (locked)
```

#### Check Audit Logs
```javascript
// In Supabase SQL Editor
SELECT * FROM audit_logs 
ORDER BY created_at DESC 
LIMIT 20;
```

---

### ⚙️ Configuration Options

#### Rate Limiting Settings
Edit in `server.js`:
```javascript
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,  // Change this to adjust max attempts
  message: "Too many login attempts, try again later"
});
```

#### Account Lockout Duration
Edit in `middleware/accountLockout.js`:
```javascript
if (newAttempts >= 5) {
  lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
}
```

#### CORS Origins
Edit in `server.js`:
```javascript
const allowedOrigins = [
  "http://localhost:5173",
  "https://whyitshop.vercel.app",
  "https://yourdomain.com"  // Add your domain here
];
```

---

### 🔍 Security Checklist

- [ ] Environment variables configured (`.env`)
- [ ] Database tables created (`SECURITY_SCHEMA.sql`)
- [ ] Rate limiting working (test with multiple requests)
- [ ] CSRF protection enabled
- [ ] HTTPS redirect configured for production
- [ ] Audit logs being recorded
- [ ] Account lockout working (test 5+ failed logins)
- [ ] Security headers verified (check in browser DevTools)
- [ ] Frontend updated with CSRF token handling
- [ ] Admin pages require authentication
- [ ] Sensitive data not logged
- [ ] Session cookies have `httpOnly` and `secure` flags

---

### 📝 Monitoring & Logs

#### View Recent Audit Logs
```sql
SELECT 
  action, 
  user_id, 
  details, 
  ip_address, 
  created_at 
FROM audit_logs 
ORDER BY created_at DESC 
LIMIT 50;
```

#### Check Failed Login Attempts
```sql
SELECT 
  email, 
  attempts, 
  locked_until, 
  updated_at 
FROM failed_logins 
WHERE attempts > 0 
ORDER BY updated_at DESC;
```

#### Find Suspicious Activity
```sql
SELECT 
  action, 
  user_id, 
  ip_address, 
  COUNT(*) as count 
FROM audit_logs 
WHERE created_at > now() - interval '1 hour'
GROUP BY action, user_id, ip_address
HAVING COUNT(*) > 10
ORDER BY count DESC;
```

---

### 🚨 Production Deployment Checklist

Before deploying to production:

1. [ ] Change `NODE_ENV=production`
2. [ ] Generate strong `SESSION_SECRET` (min 32 characters)
3. [ ] Enable HTTPS only (`secure: true` in cookies)
4. [ ] Update `FRONTEND_URL` to production domain
5. [ ] Configure CORS for production origins only
6. [ ] Set up SMTP for email notifications
7. [ ] Enable database backups
8. [ ] Monitor audit logs regularly
9. [ ] Set up alerts for suspicious activity
10. [ ] Test all security features in production environment

---

### 🆘 Troubleshooting

**Rate limiting too strict?**
- Increase `max` value in `loginLimiter` config
- Increase `windowMs` for longer window

**CSRF token errors?**
- Ensure session is configured correctly
- Check that token is being sent in request body
- Verify token is not expired (default: 1 hour)

**Account lockout not working?**
- Check that `failed_logins` table exists
- Verify `accountLockout.js` middleware is imported
- Check Supabase permissions for table access

**Audit logs not appearing?**
- Verify `audit_logs` table exists
- Check that audit middleware is being called
- Ensure Supabase credentials are correct

---

### 📚 References

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [Express-Rate-Limit Docs](https://github.com/nfriedly/express-rate-limit)
- [CSRF Protection](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Helmet.js Docs](https://helmetjs.github.io/)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)

---

### 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review error messages in console
3. Check Supabase logs for database errors
4. Verify all tables are created with correct schema
