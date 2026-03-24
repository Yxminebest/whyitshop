import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate, Link } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const createUserIfNotExists = async (user) => {
    try {
      const { data } = await supabase.from("users").select("id").eq("id", user.id).maybeSingle();
      if (!data) await supabase.from("users").insert([{ id: user.id, email: user.email, role: "user" }]);
    } catch (err) {
      console.error("Create user error:", err);
    }
  };

  const getUserRole = async (userId) => {
    const { data, error } = await supabase.from("users").select("role").eq("id", userId).single();
    if (error) return "user";
    return data?.role || "user";
  };

  const handleLogin = async () => {
    if (!email || !password) return alert("กรุณากรอกข้อมูลให้ครบ");
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return alert(error.message);

      const user = data.user;
      await createUserIfNotExists(user);
      const role = await getUserRole(user.id);

      navigate(role === "admin" ? "/admin" : "/");
    } catch (err) {
      alert("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) alert(error.message);
    } catch (err) {
      alert("Google login ล้มเหลว");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div className="glass-card" style={{ width: "100%", maxWidth: "420px", display: "flex", flexDirection: "column", gap: "18px" }}>
        
        <h1 style={{ textAlign: "center", marginBottom: "10px" }}>Welcome Back 👋</h1>

        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-glass" />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-glass" />

        <div style={{ textAlign: "right", marginTop: "-10px", marginBottom: "10px" }}>
          <Link to="/forgot-password" style={{ color: "var(--primary)", fontSize: "14px", textDecoration: "none" }}>Forgot Password?</Link>
        </div>

        <button onClick={handleLogin} disabled={loading} className="btn-primary" style={{ padding: "14px" }}>
          {loading ? "Loading..." : "Login"}
        </button>

        <button onClick={() => navigate("/register")} className="btn-success" style={{ padding: "14px" }}>
          Register
        </button>

        <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "14px", margin: "10px 0" }}>or</div>

        <button onClick={handleGoogleLogin} disabled={googleLoading} className="btn-primary" style={{ background: "var(--bg-secondary)", color: "var(--text-main)", border: "1px solid var(--card-border)" }}>
          {googleLoading ? "Connecting..." : "🔵 Continue with Google"}
        </button>
        
      </div>
    </div>
  );
}

export default Login;