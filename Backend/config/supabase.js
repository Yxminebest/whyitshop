import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv"; // เพิ่มบรรทัดนี้
dotenv.config(); // เพิ่มบรรทัดนี้เพื่อให้โหลดค่า .env ได้ทันที

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default supabase;