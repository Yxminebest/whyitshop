import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let isMounted = true; // ตัวแปรป้องกันบั๊ก React ทำงานซ้อนกัน

    const checkSession = async () => {
      try {
        // 1. ดึงข้อมูล Session ปัจจุบัน
        const { data } = await supabase.auth.getSession();
        if (isMounted) {
          setUser(data?.session?.user || null);
          setLoading(false); // ได้ข้อมูลปุ๊บ บังคับปิดโหลดปั๊บ
        }
      } catch (error) {
        console.error("Auth check error:", error);
        if (isMounted) setLoading(false);
      }
    };

    checkSession();

    // 2. ตัวช่วยจับตาดู (Listener) เผื่อ getSession ทำงานพลาดหรือค้าง
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setUser(session?.user || null);
        setLoading(false); // บังคับปิดโหลดอีกรอบเพื่อความชัวร์
      }
    });

    // ล้างข้อมูลเมื่อสลับหน้า (Clean up)
    return () => {
      isMounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: "center", marginTop: "100px" }}>
        <h2 style={{ color: "var(--text-muted)" }}>กำลังตรวจสอบสิทธิ์การเข้าถึง... ⏳</h2>
      </div>
    );
  }

  // ถ้าเช็กแล้วไม่มี User ให้เด้งไปหน้า Login แบบห้ามกด Back กลับมาหน้าเดิม
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;