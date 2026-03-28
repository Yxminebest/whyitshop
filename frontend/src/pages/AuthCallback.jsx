import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function AuthCallback() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        // Supabase จะ auto-process token จาก URL
        // ตรวจสอบว่า user ยืนยันแล้ว
        const { data } = await supabase.auth.getSession();
        
        if (data?.session?.user?.email_confirmed_at) {
          // ✅ Email verified
          alert("✅ ยืนยันอีเมลสำเร็จ!\n\nคุณสามารถเข้าสู่ระบบได้แล้ว");
          navigate("/login");
        } else {
          // ⏳ รอการยืนยัน
          setError("⏳ กำลังตรวจสอบการยืนยัน...");
          setTimeout(() => navigate("/login"), 2000);
        }
      } catch (err) {
        console.error("Email verification error:", err);
        setError("❌ เกิดข้อผิดพลาด: " + err.message);
        setTimeout(() => navigate("/login"), 3000);
      } finally {
        setLoading(false);
      }
    };

    handleEmailVerification();
  }, [navigate]);

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      backgroundColor: "#0a0e27",
      color: "white"
    }}>
      <div style={{
        textAlign: "center",
        padding: "40px",
        borderRadius: "12px",
        backgroundColor: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        maxWidth: "400px"
      }}>
        {loading ? (
          <>
            <h2>⏳ กำลังยืนยันอีเมล...</h2>
            <p>กรุณารอสักครู่</p>
          </>
        ) : error ? (
          <>
            <h2>{error}</h2>
            <p>กำลังเปลี่ยนไปหน้า Login...</p>
          </>
        ) : (
          <>
            <h2>✅ ยืนยันสำเร็จ!</h2>
            <p>กำลังเข้าสู่หน้า Login...</p>
          </>
        )}
      </div>
    </div>
  );
}

export default AuthCallback;
