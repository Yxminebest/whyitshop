import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  /* ================= CHECK LINK ================= */
  useEffect(() => {
    const hash = window.location.hash;

    // 🔥 ถ้า link มี error (expired / invalid)
    if (hash.includes("error")) {
      alert("ลิงก์หมดอายุ หรือไม่ถูกต้อง");
      navigate("/forgot-password");
      return;
    }

    // 🔥 ตรวจ session
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        alert("ลิงก์ไม่ถูกต้อง กรุณาขอใหม่");
        navigate("/forgot-password");
      }
    };

    checkSession();
  }, []);

  /* ================= UPDATE PASSWORD ================= */
  const updatePassword = async () => {
    if (!password || !confirmPassword) {
      alert("กรุณากรอกรหัสผ่าน");
      return;
    }

    if (password.length < 6) {
      alert("รหัสผ่านต้องอย่างน้อย 6 ตัว");
      return;
    }

    if (password !== confirmPassword) {
      alert("รหัสผ่านไม่ตรงกัน");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        alert(error.message);
      } else {
        alert("เปลี่ยนรหัสผ่านสำเร็จ 🎉");
        navigate("/login");
      }
    } catch (err) {
      console.log(err);
      alert("เกิดข้อผิดพลาด");
    }

    setLoading(false);
  };

  /* ================= UI ================= */

  return (
    <div style={container}>
      <div style={card}>
        <h2 style={title}>🔐 Reset Password</h2>

        <input
          type="password"
          placeholder="รหัสผ่านใหม่"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={input}
        />

        <input
          type="password"
          placeholder="ยืนยันรหัสผ่าน"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={input}
        />

        <button
          onClick={updatePassword}
          disabled={loading}
          style={button}
        >
          {loading ? "Updating..." : "Update Password"}
        </button>

        <button
          onClick={() => navigate("/forgot-password")}
          style={backBtn}
        >
          ⬅ ขอ reset ใหม่
        </button>
      </div>
    </div>
  );
}

/* ================= STYLE ================= */

const container = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
  background: "linear-gradient(135deg, #020617, #0f172a)",
};

const card = {
  background: "#0f172a",
  padding: "40px",
  borderRadius: "16px",
  width: "360px",
  textAlign: "center",
  boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
};

const title = {
  marginBottom: "20px",
  color: "#e2e8f0",
};

const input = {
  display: "block",
  padding: "12px",
  width: "100%",
  marginTop: "10px",
  borderRadius: "8px",
  border: "1px solid #334155",
  background: "#020617",
  color: "white",
  outline: "none",
};

const button = {
  marginTop: "20px",
  padding: "12px",
  width: "100%",
  background: "#22c55e",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};

const backBtn = {
  marginTop: "10px",
  padding: "10px",
  width: "100%",
  background: "#475569",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
};

export default ResetPassword;