import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * 🛡️ Protected Route สำหรับ Store Owner
 * - ตรวจสอบว่า user เป็น store_owner หรือ admin
 * - ถ้าไม่ใช่ จะ redirect ไปหน้า login
 */
function StoreOwnerRoute({ children }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        if (!user?.id) {
          setChecking(false);
          navigate("/login", { replace: true });
          return;
        }

        // ดึง role จาก users table
        const { data, error } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error || !data) {
          setChecking(false);
          navigate("/login", { replace: true });
          return;
        }

        // ตรวจสอบว่าเป็น store_owner หรือ admin
        if (data.role === "store_owner" || data.role === "admin") {
          setIsAuthorized(true);
        } else {
          alert("❌ คุณไม่มีสิทธิ์เข้าถึงส่วนนี้");
          navigate("/", { replace: true });
        }
      } catch (err) {
        console.error("Permission check error:", err);
        navigate("/", { replace: true });
      } finally {
        setChecking(false);
      }
    };

    if (!loading) {
      checkPermission();
    }
  }, [user, loading, navigate]);

  if (loading || checking) {
    return (
      <div className="page-container" style={{ textAlign: "center", marginTop: "50px" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "16px" }}>กำลังตรวจสอบสิทธิ์...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return children;
}

export default StoreOwnerRoute;
