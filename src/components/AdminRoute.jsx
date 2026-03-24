import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function AdminRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;

        if (!user) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        const { data } = await supabase.from("users").select("role").eq("id", user.id).single();
        setIsAdmin(data?.role === "admin");
      } catch (error) {
        console.error("Admin check error:", error);
        setIsAdmin(false);
      } finally {
        // 🔥 ปิดโหลดเสมอไม่ว่าจะเช็กผ่านหรือไม่ผ่าน
        setLoading(false); 
      }
    };

    checkAdmin();
  }, []);

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: "center", marginTop: "100px" }}>
        <h2 style={{ color: "var(--primary)" }}>กำลังตรวจสอบสิทธิ์ผู้ดูแลระบบ... 🛡️</h2>
      </div>
    );
  }

  // ถ้าไม่ใช่แอดมิน ให้เด้งกลับไปหน้าแรก
  if (!isAdmin) return <Navigate to="/" />;

  return children;
}

export default AdminRoute;