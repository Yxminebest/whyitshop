import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // 1. นำเข้า useAuth

function Login() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth(); // 2. ดึงสถานะปัจจุบัน

  /* ================= STATE ================= */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // 3. ถ้า Login อยู่แล้ว ให้ดีดไปหน้าแรกทันที
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  /* ================= EMAIL LOGIN ================= */
  const handleLogin = async (e) => {
    if (e) e.preventDefault(); // ป้องกันหน้าเว็บ Refresh
    if (!email || !password) return alert("กรุณากรอกข้อมูลให้ครบ");

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password 
      });
      
      if (error) throw error;

      // เมื่อสำเร็จ ไม่ต้องดึง Role เองที่นี่ 
      // เพราะ AuthContext จะตรวจพบการ Login และอัปเดต Role ให้โดยอัตโนมัติ
      alert("ยินดีต้อนรับกลับเข้าสู่ระบบ! ✨");
      navigate("/"); 
    } catch (err) {
      alert("❌ " + err.message);
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
        options: { 
          redirectTo: window.location.origin // กลับมาที่หน้าแรกของเว็บ
        },
      });
      if (error) throw error;
    } catch (err) {
      alert("❌ Google login ล้มเหลว: " + err.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="page-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: '80vh' }}>
      <form 
        onSubmit={handleLogin}
        className="glass-card" 
        style={{ width: "100%", maxWidth: "420px", display: "flex", flexDirection: "column", gap: "20px", textAlign: "center", padding: '40px' }}
      >
        
        <div style={{ marginBottom: '10px' }}>
          <h1 style={{ marginBottom: "8px", fontSize: "32px", fontWeight: '800' }}>Welcome Back 👋</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>เข้าสู่ระบบเพื่อจัดการสินค้าพรีเมียมของคุณ</p>
        </div>

        {/* INPUTS */}
        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '5px' }}>
           <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginLeft: '5px' }}>Email Address</label>
           <input 
            type="email" 
            placeholder="example@mail.com" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="input-glass"
            style={{ textAlign: "left", marginBottom: '5px' }}
            required
          />
        </div>

        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '5px' }}>
           <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginLeft: '5px' }}>Password</label>
           <input 
            type="password" 
            placeholder="••••••••" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className="input-glass"
            style={{ textAlign: "left", marginBottom: '5px' }}
            required
          />
        </div>

        <div style={{ textAlign: "right", marginTop: "-10px" }}>
          <Link to="/forgot-password" style={{ color: "var(--primary)", fontSize: "13px", textDecoration: "none", fontWeight: "700" }}>
            Forgot Password?
          </Link>
        </div>

        {/* BUTTONS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
          <button type="submit" disabled={loading} className="btn-success" style={{ padding: "14px", fontSize: "16px", fontWeight: '800' }}>
            {loading ? "⌛ Logging in..." : "Login"}
          </button>

          <button type="button" onClick={() => navigate("/register")} className="btn-primary" style={{ padding: "14px", fontSize: "16px", background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)' }}>
            Register New Account
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '10px 0' }}>
           <div style={{ flex: 1, height: '1px', background: 'var(--card-border)' }}></div>
           <span style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: "bold" }}>OR</span>
           <div style={{ flex: 1, height: '1px', background: 'var(--card-border)' }}></div>
        </div>

        <button 
          type="button"
          onClick={handleGoogleLogin} 
          disabled={googleLoading} 
          className="btn-primary" 
          style={{ 
            background: "white", 
            color: "#333", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            gap: "10px", 
            padding: "12px",
            fontWeight: '600',
            border: 'none'
          }}
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: "20px" }} />
          {googleLoading ? "Connecting..." : "Continue with Google"}
        </button>
        
      </form>
    </div>
  );
}

export default Login;