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
          {
            id: user.id,
            email: user.email,
            role: "user",
          },
        ]);
      }
    } catch (err) {
      console.error("Create user error:", err);
    }
  };

  /* ================= GET USER ROLE ================= */
  const getUserRole = async (userId) => {
    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Role fetch error:", error);
      return "user";
    }

    return data?.role || "user";
  };

  /* ================= REDIRECT BY ROLE ================= */
  const redirectByRole = (role) => {
    if (role === "admin") {
      navigate("/admin");
    } else {
      navigate("/");
    }
  };

  /* ================= EMAIL LOGIN ================= */
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
        return;
      }

      const user = data.user;

      // สร้าง user ถ้ายังไม่มี
      await createUserIfNotExists(user);

      // 🔥 ดึง role
      const role = await getUserRole(user.id);

      alert(`เข้าสู่ระบบสำเร็จ (${role}) ✅`);
      redirectByRole(role);
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
      setGoogleLoading(true);

      const redirectUrl = window.location.origin;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        alert(error.message);
      }
    } catch (err) {
      console.error("Google login error:", err);
      alert("Google login ล้มเหลว");
    } finally {
      setGoogleLoading(false);
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
          disabled={googleLoading}
        >
          {googleLoading
            ? "Connecting..."
            : "🔵 Continue with Google"}
        </button>
      </div>
    </div>
  );
}

export default Login;