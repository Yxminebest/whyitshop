import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

function ForgotPassword() {
  const navigate = useNavigate();

  /* ================= STATE ================= */
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" }); // ใช้จัดการข้อความ Error/Success

  /* ================= RESET PASSWORD ================= */
  const resetPassword = async () => {
    if (!email) {
      setMessage({ text: "⚠️ กรุณากรอกอีเมลของคุณ", type: "error" });
      return;
    }

    try {
      setLoading(true);
      setMessage({ text: "", type: "" });

      // 🔥 แก้ไข URL ให้ดึงจากเว็บปัจจุบันอัตโนมัติ (รองรับ Vercel 100%)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setMessage({ text: `❌ ${error.message}`, type: "error" });
      } else {
        setMessage({
          text: "✅ ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลแล้ว กรุณาตรวจสอบ Inbox ของคุณ",
          type: "success",
        });
        setEmail(""); // ล้างช่องกรอกอีเมล
      }
    } catch (err) {
      console.log(err);
      setMessage({ text: "❌ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        
        {/* ICON & HEADER */}
        <div style={styles.iconWrapper}>
          <span style={styles.icon}>🔐</span>
        </div>
        <h1 style={styles.title}>ลืมรหัสผ่าน?</h1>
        <p style={styles.subtitle}>
          ไม่ต้องกังวล! เพียงกรอกอีเมลที่คุณใช้สมัครสมาชิก <br />
          เราจะส่งลิงก์สำหรับตั้งค่ารหัสผ่านใหม่ไปให้
        </p>

        {/* INPUT */}
        <div style={styles.inputGroup}>
          <input
            type="email"
            placeholder="กรอกอีเมลของคุณที่นี่..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />
        </div>

        {/* MESSAGE ALERT */}
        {message.text && (
          <div
            style={message.type === "error" ? styles.errorMsg : styles.successMsg}
          >
            {message.text}
          </div>
        )}

        {/* SUBMIT BUTTON */}
        <button
          onClick={resetPassword}
          disabled={loading}
          style={loading ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
        >
          {loading ? "กำลังส่งลิงก์..." : "ส่งลิงก์รีเซ็ตรหัสผ่าน"}
        </button>

        {/* BACK BUTTON */}
        <button onClick={() => navigate("/login")} style={styles.backButton}>
          ⬅ กลับไปหน้าเข้าสู่ระบบ
        </button>

      </div>
    </div>
  );
}

/* ================= STYLE ================= */

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "radial-gradient(circle at center, #0f172a, #020617)",
    padding: "20px",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    background: "rgba(30, 41, 59, 0.6)", // กระจกโปร่งแสง
    backdropFilter: "blur(25px)",
    WebkitBackdropFilter: "blur(25px)",
    padding: "40px 30px",
    borderRadius: "24px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  iconWrapper: {
    width: "70px",
    height: "70px",
    background: "rgba(56, 189, 248, 0.1)",
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    margin: "0 auto 5px",
    border: "1px solid rgba(56, 189, 248, 0.2)",
  },
  icon: {
    fontSize: "30px",
  },
  title: {
    color: "white",
    fontSize: "26px",
    fontWeight: "bold",
    margin: "0",
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: "14px",
    lineHeight: "1.6",
    margin: "0 0 5px 0",
  },
  inputGroup: {
    width: "100%",
  },
  input: {
    width: "100%",
    padding: "15px",
    borderRadius: "12px",
    border: "1px solid #334155",
    background: "#020617",
    color: "white",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box",
    transition: "0.3s",
  },
  button: {
    width: "100%",
    padding: "14px",
    background: "linear-gradient(90deg, #38bdf8, #2563eb)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "0.3s",
    boxShadow: "0 10px 20px rgba(37, 99, 235, 0.3)",
    marginTop: "5px",
  },
  buttonDisabled: {
    background: "#475569",
    boxShadow: "none",
    cursor: "not-allowed",
    opacity: 0.7,
  },
  backButton: {
    background: "transparent",
    color: "#94a3b8",
    border: "none",
    marginTop: "10px",
    cursor: "pointer",
    fontSize: "14px",
    textDecoration: "underline",
    transition: "0.3s",
  },
  errorMsg: {
    color: "#ef4444",
    background: "rgba(239, 68, 68, 0.1)",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "14px",
    border: "1px solid rgba(239, 68, 68, 0.2)",
  },
  successMsg: {
    color: "#22c55e",
    background: "rgba(34, 197, 94, 0.1)",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "14px",
    border: "1px solid rgba(34, 197, 94, 0.2)",
    lineHeight: "1.5",
  },
};

export default ForgotPassword;