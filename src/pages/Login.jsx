import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import { logAction } from "../utils/logger"; // ✅ เพิ่ม

function Login() {
  const navigate = useNavigate();

  /* ================= STATE ================= */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  /* ================= CREATE USER ================= */
  const createUserIfNotExists = async (user) => {
    try {
      const { data } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!data) {
        await supabase.from("users").insert([
          { id: user.id, email: user.email, role: "user" }
        ]);
      }
    } catch (err) {
      console.error("Create user error:", err);
    }
  };

  /* ================= GET ROLE ================= */
  const getUserRole = async (userId) => {
    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (error) return "user";
    return data?.role || "user";
  };

  /* ================= EMAIL LOGIN ================= */
  const handleLogin = async () => {
    if (!email || !password) return alert("กรุณากรอกข้อมูลให้ครบ");

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) return alert("❌ " + error.message);

      const user = data.user;

      await createUserIfNotExists(user);

      // ✅ เพิ่ม Logging ตรงนี้ (สำคัญ)
      await logAction("LOGIN", `User login: ${user.email}`);

      const role = await getUserRole(user.id);

      navigate(role === "admin" ? "/admin" : "/");

    } catch (err) {
      alert("เกิดข้อผิดพลาดของระบบ");
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
        options: { redirectTo: window.location.origin }
      });

      if (error) alert("❌ " + error.message);

      // ⚠️ Google login จะ redirect
      // ถ้าจะ log ต้องทำในหน้า callback (optional)

    } catch (err) {
      alert("Google login ล้มเหลว");
    } finally {
      setGoogleLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div
      className="page-container"
      style={{ display: "flex", justifyContent: "center", alignItems: "center" }}
    >
      <div
        className="glass-card"
        style={{
          width: "100%",
          maxWidth: "420px",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          textAlign: "center"
        }}
      >
        <h1 style={{ marginBottom: "10px", fontSize: "28px" }}>
          Welcome Back 👋
        </h1>

        {/* INPUTS */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-glass"
          style={{ textAlign: "left" }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-glass"
          style={{ textAlign: "left" }}
        />

        <div style={{ textAlign: "right", marginTop: "-10px", marginBottom: "10px" }}>
          <Link
            to="/forgot-password"
            style={{
              color: "var(--primary)",
              fontSize: "14px",
              textDecoration: "none",
              fontWeight: "bold"
            }}
          >
            Forgot Password?
          </Link>
        </div>

        {/* BUTTONS */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="btn-primary"
          style={{ padding: "14px", fontSize: "16px" }}
        >
          {loading ? "Loading..." : "Login"}
        </button>

        <button
          onClick={() => navigate("/register")}
          className="btn-success"
          style={{ padding: "14px", fontSize: "16px" }}
        >
          Register
        </button>

        <div
          style={{
            color: "var(--text-muted)",
            fontSize: "14px",
            margin: "10px 0",
            fontWeight: "bold"
          }}
        >
          — OR —
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="btn-primary"
          style={{
            background: "var(--bg-secondary)",
            color: "var(--text-main)",
            border: "1px solid var(--card-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            padding: "12px"
          }}
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            style={{ width: "20px" }}
          />
          {googleLoading ? "Connecting..." : "Continue with Google"}
        </button>
      </div>
    </div>
  );
}

export default Login;