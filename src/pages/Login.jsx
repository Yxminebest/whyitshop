import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate, Link } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  /* ================= CREATE USER IN TABLE ================= */

  const createUserIfNotExists = async (user) => {
    const { data } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!data) {
      await supabase.from("users").insert([
        {
          id: user.id,
          email: user.email,
          role: "user", // default
        },
      ]);
    }
  };

  /* ================= LOGIN ================= */

  const handleLogin = async () => {
    if (!email || !password) {
      alert("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert(error.message);
      } else {
        // 🔥 สร้าง user ใน table ถ้ายังไม่มี
        await createUserIfNotExists(data.user);

        alert("เข้าสู่ระบบสำเร็จ ✅");
        navigate("/");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  /* ================= GOOGLE LOGIN ================= */

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        alert(error.message);
      }
    } catch (err) {
      console.error("Google login error:", err);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Welcome Back 👋</h1>

        {/* EMAIL */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* PASSWORD */}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* FORGOT PASSWORD */}
        <p style={{ marginTop: "8px", fontSize: "14px" }}>
          <Link
            to="/forgot-password"
            style={{ color: "#38bdf8", textDecoration: "none" }}
          >
            Forgot Password?
          </Link>
        </p>

        {/* LOGIN */}
        <button
          className="login-btn"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Loading..." : "Login"}
        </button>

        {/* REGISTER */}
        <button
          className="register-btn"
          onClick={() => navigate("/register")}
        >
          Register
        </button>

        <div className="divider">or</div>

        {/* GOOGLE LOGIN */}
        <button
          className="google-btn"
          onClick={handleGoogleLogin}
        >
          🔵 Continue with Google
        </button>
      </div>
    </div>
  );
}

export default Login;