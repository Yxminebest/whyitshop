import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setUser(data?.session?.user || null);
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        // 🔥 บรรทัดนี้สำคัญมาก! เช็กเสร็จแล้วต้องสั่งปิดโหลด ไม่งั้นค้าง
        setLoading(false);
      }
    };
    
    checkSession();
  }, []);

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: "center", marginTop: "100px" }}>
        <h2 style={{ color: "var(--text-muted)" }}>กำลังตรวจสอบสิทธิ์การเข้าถึง... ⏳</h2>
      </div>
    );
  }

  // ถ้าเช็กแล้วไม่พบผู้ใช้ ให้เด้งกลับไปหน้า Login
  if (!user) return <Navigate to="/login" />;

  return children;
}

export default ProtectedRoute;