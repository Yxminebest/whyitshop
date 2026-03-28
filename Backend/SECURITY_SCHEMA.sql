-- 🔐 WhyITshop Security Schema
-- Run these SQL queries in Supabase SQL Editor to set up security features

-- ✅ 1. Account Lockout Table
-- เก็บข้อมูลการพยายาม login ที่ล้มเหลว
CREATE TABLE IF NOT EXISTS failed_logins (
  email TEXT PRIMARY KEY,
  attempts INT DEFAULT 0,
  locked_until TIMESTAMP NULL,
  updated_at TIMESTAMP DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_failed_logins_email ON failed_logins(email);

-- Enable RLS (Row Level Security)
ALTER TABLE failed_logins ENABLE ROW LEVEL SECURITY;

-- Allow public to read (for login checks) and service role to update
CREATE POLICY "Allow service role to manage failed logins"
ON failed_logins
FOR ALL
USING (true)
WITH CHECK (true);

-- ✅ 2. Audit Logs Table
-- เก็บประวัติการเข้าถึงและการดำเนินการทั้งหมด
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  user_id UUID NULL,
  details JSONB NULL,
  ip_address TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only allow users to read their own logs, admins can read all
CREATE POLICY "Users can read their own audit logs"
ON audit_logs
FOR SELECT
USING (
  auth.uid() = user_id OR
  (auth.jwt() ->> 'user_metadata' ->> 'role')::text = 'admin'
);

-- Allow service role to insert
CREATE POLICY "Allow service role to insert audit logs"
ON audit_logs
FOR INSERT
WITH CHECK (true);

-- ✅ 3. Grant permissions to authenticated users
-- This allows your app to read from these tables
GRANT SELECT ON failed_logins TO authenticated;
GRANT UPDATE ON failed_logins TO authenticated;
GRANT INSERT ON audit_logs TO authenticated;
GRANT SELECT ON audit_logs TO authenticated;

-- Allow anon for CSRF token endpoint (if needed)
GRANT SELECT ON failed_logins TO anon;

-- ✅ 4. View for audit logs (optional - for admin dashboard)
CREATE OR REPLACE VIEW admin_audit_logs AS
SELECT 
  id,
  action,
  user_id,
  details,
  ip_address,
  created_at
FROM audit_logs
ORDER BY created_at DESC
LIMIT 1000;

GRANT SELECT ON admin_audit_logs TO authenticated;
