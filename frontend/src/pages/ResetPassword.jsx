import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ResetPassword() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  /* ================= STATE ================= */
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  /* ================= CHECK LINK & SESSION ================= */
  useEffect(() => {
    const hash = window.location.hash;

    // 🔥 ตรวจสอบว่าลิงก์ Error หรือหมดอายุหรือไม่
    if (hash.includes("error")) {
      setMessage({ text: "⚠️ ลิงก์หมดอายุหรือไม่ถูกต้อง กรุณาขอลิงก์ใหม่", type: "error" });
      setTimeout(() => navigate("/forgot-password"), 3000);
      return;
    }

    // 🔥 ถ้า auth context ไม่พร้อมหรือไม่มี user ก็ไป forgot-password
    if (!user && !authLoading) {
      setMessage({ text: "⚠️ ไม่พบสิทธิ์ในการเปลี่ยนรหัสผ่าน กรุณาขอลิงก์ใหม่", type: "error" });
      setTimeout(() => navigate("/forgot-password"), 3000);
    }
  }, [user, authLoading, navigate]);

  /* ================= UPDATE PASSWORD ================= */
  const updatePassword = async () => {
    if (!password || !confirmPassword) {
      setMessage({ text: "⚠️ กรุณากรอกรหัสผ่านให้ครบทั้งสองช่อง", type: "error" });
      return;
    }

    if (password.length < 6) {
      setMessage({ text: "⚠️ รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร", type: "error" });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ text: "⚠️ รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน", type: "error" });
      return;
    }

    try {
      setLoading(true);
      setMessage({ text: "", type: "" }); // เคลียร์ข้อความเก่า

      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setMessage({ text: `❌ ${error.message}`, type: "error" });
      } else {
        setMessage({ 
          text: "🎉 เปลี่ยนรหัสผ่านสำเร็จ! กำลังพากลับไปหน้าเข้าสู่ระบบ...", 
          type: "success" 
        });
        
        // หน่วงเวลา 2.5 วินาทีให้ผู้ใช้อ่านข้อความ แล้วพาไปหน้า Login
        setTimeout(() => navigate("/login"), 2500);
      }
    } catch (err) {
      console.log(err);
      setMessage({ text: "❌ เกิดข้อผิดพลาดของระบบ กรุณาลองใหม่อีกครั้ง", type: "error" });
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
          <span style={styles.icon}>🔑</span>
        </div>
        <h2 style={styles.title}>ตั้งรหัสผ่านใหม่</h2>
        <p style={styles.subtitle}>
          กรุณาตั้งรหัสผ่านใหม่ของคุณ (ความยาวขั้นต่ำ 6 ตัวอักษร)
        </p>

        {/* INPUTS */}
        <div style={styles.inputGroup}>
          <input
            type="password"
            placeholder="รหัสผ่านใหม่"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
          <input
            type="password"
            placeholder="ยืนยันรหัสผ่านใหม่อีกครั้ง"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{ ...styles.input, marginTop: "12px" }}
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
          onClick={updatePassword}
          disabled={loading || message.type === "success"}
          style={
            loading || message.type === "success" 
              ? { ...styles.button, ...styles.buttonDisabled } 
              : styles.button
          }
        >
          {loading ? "กำลังอัปเดตรหัสผ่าน..." : "ยืนยันการเปลี่ยนรหัสผ่าน"}
        </button>

        {/* BACK BUTTON */}
        <button
          onClick={() => navigate("/forgot-password")}
          style={styles.backButton}
        >
          ⬅ ขอกู้คืนรหัสผ่านใหม่
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
    background: "rgba(30, 41, 59, 0.6)",
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
    background: "rgba(34, 197, 94, 0.1)", // ใช้โทนสีเขียวให้ดูเหมือนการปลดล็อคสำเร็จ
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    margin: "0 auto 5px",
    border: "1px solid rgba(34, 197, 94, 0.2)",
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
    textAlign: "left",
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
    background: "linear-gradient(90deg, #22c55e, #16a34a)", // ปุ่มสีเขียวเด่นๆ
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "0.3s",
    boxShadow: "0 10px 20px rgba(34, 197, 94, 0.3)",
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
    textAlign: "left",
  },
  successMsg: {
    color: "#22c55e",
    background: "rgba(34, 197, 94, 0.1)",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "14px",
    border: "1px solid rgba(34, 197, 94, 0.2)",
    lineHeight: "1.5",
    textAlign: "left",
  },
};

export default ResetPassword;