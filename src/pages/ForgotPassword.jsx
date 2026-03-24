import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

function ForgotPassword() {
  const navigate = useNavigate();

  /* ================= STATE ================= */
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  /* ================= RESET PASSWORD ================= */
  const resetPassword = async (e) => {
    if (e) e.preventDefault(); // ป้องกันการ Refresh หน้าเว็บถ้ากด Enter
    
    if (!email) {
      setMessage({ text: "⚠️ กรุณากรอกอีเมลของคุณ", type: "error" });
      return;
    }

    try {
      setLoading(true);
      setMessage({ text: "", type: "" });

      // รองรับ Vercel และ Localhost อัตโนมัติ
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setMessage({ text: `❌ ${error.message}`, type: "error" });
      } else {
        setMessage({
          text: "✅ ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลแล้ว กรุณาตรวจสอบ Inbox ของคุณ (รวมถึงใน Junk Mail)",
          type: "success",
        });
        setEmail(""); 
      }
    } catch (err) {
      setMessage({ text: "❌ เกิดข้อผิดพลาดทางเทคนิค กรุณาลองใหม่อีกครั้ง", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="page-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: '80vh' }}>
      <form 
        onSubmit={resetPassword}
        className="glass-card" 
        style={{ width: "100%", maxWidth: "420px", textAlign: "center", padding: '40px' }}
      >
        
        {/* ICON & HEADER */}
        <div style={{ 
          width: "70px", height: "70px", background: "rgba(56, 189, 248, 0.1)", 
          borderRadius: "50%", display: "flex", justifyContent: "center", 
          alignItems: "center", margin: "0 auto 20px", border: "1px solid var(--card-border)" 
        }}>
          <span style={{ fontSize: "30px" }}>🔐</span>
        </div>

        <h1 style={{ marginBottom: "10px", fontSize: "28px", fontWeight: "800" }}>ลืมรหัสผ่าน?</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6", marginBottom: "25px" }}>
          ไม่ต้องกังวล! เพียงกรอกอีเมลที่คุณใช้สมัครสมาชิก <br />
          เราจะส่งลิงก์สำหรับตั้งค่ารหัสผ่านใหม่ไปให้
        </p>

        {/* INPUT */}
        <div style={{ textAlign: 'left', marginBottom: '20px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginLeft: '5px', display: 'block', marginBottom: '8px' }}>
            Email Address
          </label>
          <input
            type="email"
            placeholder="example@mail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-glass"
            style={{ marginBottom: 0 }}
            required
          />
        </div>

        {/* MESSAGE ALERT */}
        {message.text && (
          <div style={{ 
            color: message.type === "error" ? "var(--danger)" : "var(--accent)", 
            background: message.type === "error" ? "rgba(239, 68, 68, 0.1)" : "rgba(34, 197, 94, 0.1)",
            padding: "15px", borderRadius: "12px", fontSize: "14px", 
            border: `1px solid ${message.type === "error" ? "rgba(239, 68, 68, 0.2)" : "rgba(34, 197, 94, 0.2)"}`,
            marginBottom: "20px", lineHeight: "1.5"
          }}>
            {message.text}
          </div>
        )}

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="btn-success"
          style={{ width: "100%", padding: "14px", fontSize: "16px", fontWeight: "800", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "⌛ กำลังส่งลิงก์..." : "ส่งลิงก์รีเซ็ตรหัสผ่าน"}
        </button>

        {/* BACK BUTTON */}
        <button 
          type="button"
          onClick={() => navigate("/login")} 
          style={{ 
            background: "transparent", color: "var(--text-muted)", border: "none", 
            marginTop: "20px", cursor: "pointer", fontSize: "14px", textDecoration: "underline" 
          }}
        >
          ⬅ กลับไปหน้าเข้าสู่ระบบ
        </button>

      </form>
    </div>
  );
}

export default ForgotPassword;