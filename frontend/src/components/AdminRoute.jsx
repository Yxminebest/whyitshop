import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        setChecking(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        if (isMounted) {
          setIsAdmin(data?.role === "admin");
        }
      } catch (error) {
        console.error("Admin check error:", error);
        if (isMounted) {
          setIsAdmin(false);
        }
      } finally {
        if (isMounted) {
          setChecking(false);
        }
      }
    };

    checkAdmin();

    return () => {
      isMounted = false;
    };
  }, [user]);

  if (loading || checking) {
    return (
      <div className="page-container" style={{ textAlign: "center", marginTop: "100px" }}>
        <div className="glass-card" style={{ padding: "40px", display: "inline-block" }}>
          <h2 style={{ color: "var(--primary)" }}>กำลังตรวจสอบสิทธิ์ผู้ดูแลระบบ... 🛡️</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "10px" }}>กรุณารอสักครู่...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    console.warn("User is not admin, redirecting to home");
    return <Navigate to="/" replace />;
  }

  return children;
}

export default AdminRoute;