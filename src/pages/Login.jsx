import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate, Link } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  /* ================= STATE ================= */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  /* ================= CREATE USER (If Google Login) ================= */
  const createUserIfNotExists = async (user) => {
    try {
      const { data } = await supabase.from("users").select("id").eq("id", user.id).maybeSingle();
      if (!data) await supabase.from("users").insert([{ id: user.id, email: user.email, role: "user" }]);
    } catch (err) {
      console.error("Create user error:", err);
    }
  };

  /* ================= GET ROLE & REDIRECT ================= */
  const getUserRole = async (userId) => {
    const { data } = await supabase.from("users").select("role").eq("id", userId).single();
    return data?.role || "user";
  };

  /* ================= EMAIL LOGIN ================= */
  const handleLogin = async () => {
    setErrorMsg("");
    if (!email || !password) return setErrorMsg("⚠️ กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน");

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        setErrorMsg("❌ " + error.message);
        return;
      }

      const user = data.user;
      await createUserIfNotExists(user);
      const role = await getUserRole(user.id);

      navigate(role === "admin" ? "/admin" : "/");
    } catch (err) {
      setErrorMsg("❌ เกิดข้อผิดพลาดของระบบ");
    } finally {
      setLoading(false);
    }
  };

  /* ================= GOOGLE LOGIN ================= */
  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin }, // ดึง URL เว็บอัตโนมัติ (รองรับ Vercel)
      });
      if (error) setErrorMsg("❌ " + error.message);
    } catch (err) {
      setErrorMsg("❌ Google login ล้มเหลว");
    } finally {
      setGoogleLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="login-premium-wrapper">
      <div className="login-premium-box">
        
        {/* ================= LEFT SIDE (ARTWORK) ================= */}
        <div className="login-art-panel">
          <div className="glass-circle circle-1"></div>
          <div className="glass-circle circle-2"></div>
          
          <div style={{ position: "relative", zIndex: 10 }}>
            <h1 style={{ fontSize: "46px", fontWeight: "900", marginBottom: "15px", letterSpacing: "-1px" }}>
              WHY IT Shop
            </h1>
            <p style={{ fontSize: "18px", opacity: 0.9, lineHeight: "1.6", maxWidth: "80%" }}>
              ยกระดับประสบการณ์การเล่นเกมและการทำงานของคุณ ด้วยอุปกรณ์ไอทีระดับพรีเมียม
            </p>
          </div>
          
          <div className="art-footer">
            <p>© 2026 WHY IT. All rights reserved.</p>
          </div>
        </div>

        {/* ================= RIGHT SIDE (FORM) ================= */}
        <div className="login-form-panel">
          <div style={{ maxWidth: "360px", width: "100%", margin: "0 auto" }}>
            
            <h2 style={{ fontSize: "32px", marginBottom: "8px", color: "var(--text-main)" }}>Welcome Back 👋</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "30px", fontSize: "15px" }}>
              เข้าสู่ระบบเพื่อดำเนินการต่อ
            </p>

            {/* ERROR MESSAGE */}
            {errorMsg && <div className="error-alert">{errorMsg}</div>}

            {/* INPUTS */}
            <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginBottom: "15px" }}>
              <div>
                <label className="input-label">Email</label>
                <input 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="input-glass"
                  style={{ marginBottom: 0 }}
                />
              </div>

              <div>
                <label className="input-label">Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="input-glass"
                  style={{ marginBottom: 0 }}
                />
              </div>
            </div>

            <div style={{ textAlign: "right", marginBottom: "25px" }}>
              <Link to="/forgot-password" style={{ color: "var(--primary)", fontSize: "14px", fontWeight: "bold", textDecoration: "none" }}>
                ลืมรหัสผ่าน?
              </Link>
            </div>

            {/* BUTTONS */}
            <button onClick={handleLogin} disabled={loading} className="btn-primary" style={{ width: "100%", padding: "14px", fontSize: "16px" }}>
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ (Login)"}
            </button>

            <div className="divider-line">
              <span>OR</span>
            </div>

            <button onClick={handleGoogleLogin} disabled={googleLoading} className="google-btn">
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: "20px" }} />
              {googleLoading ? "กำลังเชื่อมต่อ..." : "Continue with Google"}
            </button>

            <p style={{ textAlign: "center", marginTop: "25px", color: "var(--text-muted)", fontSize: "14px" }}>
              ยังไม่มีบัญชีใช่ไหม?{" "}
              <Link to="/register" style={{ color: "var(--accent)", fontWeight: "bold", textDecoration: "none" }}>
                สมัครสมาชิกใหม่
              </Link>
            </p>

          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;