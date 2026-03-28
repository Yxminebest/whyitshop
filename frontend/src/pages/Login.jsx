import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import { logAction } from "../utils/logger";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const syncUserToPublicTable = async (user) => {
    try {
      const { error } = await supabase.from("users").upsert(
        { 
          id: user.id, 
          email: user.email, 
        }, 
        { onConflict: 'id' }
      );
      
      if (error) console.error("Sync user error:", error.message);
    } catch (err) {
      console.error("Critical sync error:", err);
    }
  };

  const getUserRole = async (userId) => {
    try {
      const { data } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .maybeSingle();
      return data?.role || "user";
    } catch {
      return "user";
    }
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!email || !password) return alert("กรุณากรอกข้อมูลให้ครบช่องครับ");

    try {
      setLoading(true);

      // ✅ REAL Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) throw new Error(error.message);
      if (!data.user) throw new Error("Login failed");

      // Sync user to public table
      await syncUserToPublicTable(data.user);

      // Get user role
      const role = await getUserRole(data.user.id);

      // Log action
      logAction("LOGIN", `User ${data.user.email} logged in with role: ${role}`);

      // Redirect
      navigate(role === "admin" ? "/admin/dashboard" : "/");

    } catch (err) {
      console.error("Login error:", err);
      setLoading(false);
      alert("❌ " + (err.message || "Login failed"));
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (err) {
      alert("❌ Google login ล้มเหลว: " + err.message);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "90vh" }}>
      <div className="glass-card" style={{ width: "100%", maxWidth: "420px", padding: "40px", textAlign: "center" }}>
        
        <h1 style={{ marginBottom: "25px", fontSize: "28px", fontWeight: "800" }}>Welcome Back 👋</h1>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <input
            type="email"
            placeholder="อีเมล (Email)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-glass"
            style={{ textAlign: "left" }}
            autoComplete="email"
            required
          />

          <input
            type="password"
            placeholder="รหัสผ่าน (Password)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-glass"
            style={{ textAlign: "left" }}
            autoComplete="current-password"
            required
          />

          <div style={{ textAlign: "right", marginTop: "-5px" }}>
            <Link to="/forgot-password" style={{ color: "var(--primary)", fontSize: "14px", textDecoration: "none", fontWeight: "bold" }}>
              ลืมรหัสผ่าน?
            </Link>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="btn-primary" 
            style={{ padding: "14px", fontSize: "16px", marginTop: "10px", fontWeight: "bold" }}
          >
            {loading ? "กำลังตรวจสอบข้อมูล..." : "LOGIN"}
          </button>
        </form>

        <button 
          onClick={() => navigate("/register")} 
          className="btn-success" 
          style={{ width: "100%", padding: "14px", fontSize: "16px", marginTop: "15px", fontWeight: "bold" }}
        >
          สมัครสมาชิกใหม่
        </button>

        <div style={{ color: "var(--text-muted)", fontSize: "13px", margin: "20px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
          <hr style={{ flex: 1, border: "0.1px solid var(--card-border)" }} />
          <span>หรือ</span>
          <hr style={{ flex: 1, border: "0.1px solid var(--card-border)" }} />
        </div>

        <button 
          onClick={handleGoogleLogin} 
          disabled={googleLoading} 
          className="btn-primary" 
          style={{ 
            width: "100%",
            background: "var(--bg-secondary)", 
            color: "var(--text-main)", 
            border: "1px solid var(--card-border)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            gap: "10px", 
            padding: "12px",
            fontWeight: "bold"
          }}
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: "20px" }} />
          {googleLoading ? "กำลังเชื่อมต่อ..." : "Continue with Google"}
        </button>
      </div>
    </div>
  );
}

export default Login;