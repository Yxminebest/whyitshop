import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // ❌ ไม่ใช้ listener - ใช้ getSession() ครั้งเดียว
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted) {
          setUser(session?.user || null);
          setLoading(false);
        }
      } catch (err) {
        console.error("Session check error:", err);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: "center", marginTop: "100px" }}>
        <div className="glass-card" style={{ padding: "40px", display: "inline-block" }}>
          <h2 style={{ color: "var(--text-main)", marginBottom: "15px" }}>กำลังตรวจสอบสิทธิ์การเข้าถึง... ⏳</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>กรุณารอสักครู่...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;