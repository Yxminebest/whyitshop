import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let isMounted = true;

    // 1. ฟังก์ชันตรวจสอบ Session
    const checkSession = async () => {
      // 🕒 ตั้งค่า Safety Timeout: ถ้าผ่านไป 2.5 วินาทียังเช็กไม่เสร็จ ให้เลิกโหลด (ป้องกันหน้าค้าง)
      const timeout = setTimeout(() => {
        if (isMounted && loading) {
          console.warn("Auth check timed out, forcing load finish.");
          setLoading(false);
        }
      }, 5000);

      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (isMounted) {
          const currentUser = data?.session?.user || null;
          setUser(currentUser);
          setLoading(false); // ปิด Loading ทันทีที่ได้คำตอบ
        }
      } catch (error) {
        console.error("Auth check error:", error);
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
      } finally {
        clearTimeout(timeout); // ล้าง Timeout ทิ้งถ้าทำงานเสร็จก่อนเวลา
      }
    };

    checkSession();

    // 2. Listener สำหรับตรวจจับการเปลี่ยนแปลงสถานะ (Login/Logout)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (isMounted) {
        const currentUser = session?.user || null;
        setUser(currentUser);
        setLoading(false);

        // ถ้า User สั่ง Logout หรือ Session หมดอายุ ให้ล้างค่าในเครื่องด้วย
        if (event === 'SIGNED_OUT') {
          localStorage.clear();
          sessionStorage.clear();
        }
      }
    });

    return () => {
      isMounted = false;
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // หน้าจอระหว่างรอตรวจสอบ (เพิ่มปุ่มเผื่อกรณีค้างจริงๆ)
  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: "center", marginTop: "100px" }}>
        <div className="glass-card" style={{ padding: "40px", display: "inline-block" }}>
          <h2 style={{ color: "var(--text-main)", marginBottom: "15px" }}>กำลังตรวจสอบสิทธิ์การเข้าถึง... ⏳</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>หากหน้าจอนี้ค้างนานเกินไป กรุณารีเฟรชหน้าเว็บ</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary" 
            style={{ marginTop: "20px", padding: "8px 20px" }}
          >
            รีเฟรชหน้าเว็บ
          </button>
        </div>
      </div>
    );
  }

  // ถ้าตรวจสอบเสร็จแล้วไม่มี User ให้ส่งไปหน้า Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ถ้ามี User ให้แสดงผลเนื้อหาข้างใน (children)
  return children;
}

export default ProtectedRoute;