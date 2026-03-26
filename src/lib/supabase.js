import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // ให้จำการล็อกอินไว้
    autoRefreshToken: true, // ให้ต่ออายุตั๋วอัตโนมัติ
    detectSessionInUrl: true // จำเป็นสำหรับระบบสมัครสมาชิก
  }
})