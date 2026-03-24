import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

function ResetPassword() {
  const navigate = useNavigate();

  /* ================= STATE ================= */
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  /* ================= CHECK LINK & SESSION ================= */
  useEffect(() => {
    const hash = window.location.hash;

    // ตรวจสอบว่าลิงก์ Error หรือหมดอายุหรือไม่
    if (hash.includes("error")) {
      setMessage({ text: "⚠️ ลิงก์หมดอายุหรือไม่ถูกต้อง กรุณาขอลิงก์ใหม่", type: "error" });
      setTimeout(() => navigate("/forgot-password"), 3000);
      return;
    }

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setMessage({ text: "⚠️ ไม่พบสิทธิ์ในการเปลี่ยนรหัสผ่าน กรุณาขอลิงก์ใหม่", type: "error" });
        setTimeout(() => navigate("/forgot-password"), 3000);
      }
    };

    checkSession();
  }, [navigate]);

  /* ================= UPDATE PASSWORD ================= */
  const updatePassword = async (e) => {
    if (e) e.preventDefault(); // ป้องกันหน้า Refresh เมื่อกด Enter

    if (!password || !confirmPassword) {
      setMessage({ text: "⚠️ กรุณากรอกรหัสผ่านให้ครบทั้งสองช่อง", type: "error" });
      return;
    }

    if (password.length < 6) {
      setMessage({ text: "⚠️ รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร", type: "error" });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ text: "⚠️ รหัสผ่านไม่ตรงกัน", type: "error" });
      return;
    }

    try {
      setLoading(true);
      setMessage({ text: "", type: "" });

      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setMessage({ text: `❌ ${error.message}`, type: "error" });
      } else {
        setMessage({ 
          text: "🎉 เปลี่ยนรหัสผ่านสำเร็จ! ระบบกำลังพากลับไปหน้าเข้าสู่ระบบ...", 
          type: "success" 
        });
        setTimeout(() => navigate("/login"), 2500);
      }
    } catch (err) {
      setMessage({ text: "❌ เกิดข้อผิดพลาดของระบบ กรุณาลองใหม่อีกครั้ง", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="page-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: '80vh' }}>
      <form 
        onSubmit={updatePassword}
        className="glass-card" 
        style={{ width: "100%", maxWidth: "420px", textAlign: "center", padding: '40px' }}
      >
        
        {/* ICON & HEADER */}
        <div style={{ 
          width: "70px", height: "70px", background: "rgba(34, 197, 94, 0.1)", 
          borderRadius: "50%", display: "flex", justifyContent: "center", 
          alignItems: "center", margin: "0 auto 20px", border: "1px solid var(--card-border)" 
        }}>
          <span style={{ fontSize: "30px" }}>🔑</span>
        </div>

        <h2 style={{ marginBottom: "10px", fontSize: "28px", fontWeight: "800" }}>ตั้งรหัสผ่านใหม่</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6", marginBottom: "25px" }}>
          กรุณาตั้งรหัสผ่านใหม่ของคุณ <br />(ความยาวขั้นต่ำ 6 ตัวอักษร)
        </p>

        {/* INPUTS */}
        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginLeft: '5px', display: 'block', marginBottom: '8px' }}>
              New Password
            </label>
            <input
              type="password"
              placeholder="รหัสผ่านใหม่"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-glass"
              style={{ marginBottom: 0 }}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginLeft: '5px', display: 'block', marginBottom: '8px' }}>
              Confirm New Password
            </label>
            <input
              type="password"
              placeholder="ยืนยันรหัสผ่านใหม่อีกครั้ง"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-glass"
              style={{ marginBottom: 0 }}
              required
            />
          </div>
        </div>

        {/* MESSAGE ALERT */}
        {message.text && (
          <div style={{ 
            color: message.type === "error" ? "var(--danger)" : "var(--accent)", 
            background: message.type === "error" ? "rgba(239, 68, 68, 0.1)" : "rgba(34, 197, 94, 0.1)",
            padding: "15px", borderRadius: "12px", fontSize: "14px", 
            border: `1px solid ${message.type === "error" ? "rgba(239, 68, 68, 0.2)" : "rgba(34, 197, 94, 0.2)"}`,
            marginBottom: "20px", textAlign: 'left', lineHeight: "1.5"
          }}>
            {message.text}
          </div>
        )}

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={loading || message.type === "success"}
          className="btn-success"
          style={{ width: "100%", padding: "14px", fontSize: "16px", fontWeight: "800", opacity: (loading || message.type === "success") ? 0.7 : 1 }}
        >
          {loading ? "⌛ กำลังอัปเดต..." : "ยืนยันการเปลี่ยนรหัสผ่าน"}
        </button>

        {/* BACK BUTTON */}
        <button
          type="button"
          onClick={() => navigate("/forgot-password")}
          style={{ 
            background: "transparent", color: "var(--text-muted)", border: "none", 
            marginTop: "20px", cursor: "pointer", fontSize: "14px", textDecoration: "underline" 
          }}
        >
          ⬅ ขอกู้คืนรหัสผ่านใหม่
        </button>

      </form>
    </div>
  );
}

export default ResetPassword;