import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import { sanitizeInput } from "../utils/sanitize";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: ""
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 🔐 sanitize
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: sanitizeInput(value)
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.username ||
      !formData.email ||
      !formData.phone ||
      !formData.address ||
      !formData.password
    ) {
      return setErrorMsg("⚠️ กรุณากรอกข้อมูลให้ครบทุกช่อง");
    }

    if (formData.password !== formData.confirmPassword) {
      return setErrorMsg("❌ รหัสผ่านไม่ตรงกัน");
    }

    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!strongPasswordRegex.test(formData.password)) {
      return setErrorMsg("⚠️ รหัสผ่านต้องมี A-Z, a-z และตัวเลข");
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: `${formData.firstName} ${formData.lastName}`,
            username: formData.username
          }
        }
      });

      if (error) throw error;

      if (data?.user) {
        const { error: dbError } = await supabase.from("users").upsert([
          {
            id: data.user.id,
            email: sanitizeInput(formData.email),
            username: sanitizeInput(formData.username),
            firstname: sanitizeInput(formData.firstName),
            lastname: sanitizeInput(formData.lastName),
            phone: sanitizeInput(formData.phone),
            address: sanitizeInput(formData.address),
            role: "user"
          }
        ]);

        if (dbError) throw dbError;
      }

      alert("🎉 สมัครสำเร็จ!");
      navigate("/");

    } catch (err) {
      setErrorMsg("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="page-container"
      style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}
    >
      <div
        className="glass-card"
        style={{
          width: "100%",
          maxWidth: "500px",
          textAlign: "center",
          padding: "40px"
        }}
      >
        <h1 style={{ marginBottom: "20px" }}>Create Account 🚀</h1>

        {errorMsg && (
          <div style={{ color: "#ff4d4f", marginBottom: "10px" }}>
            {errorMsg}
          </div>
        )}

        <form style={{ display: "flex", flexDirection: "column", gap: "12px" }} onSubmit={handleRegister}>
          
          <input className="input-glass" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First Name" />
          <input className="input-glass" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last Name" />
          <input className="input-glass" name="username" value={formData.username} onChange={handleChange} placeholder="Username" />
          <input className="input-glass" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" />
          <input className="input-glass" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" />

          <textarea
            className="input-glass"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Address"
            style={{ resize: "none", height: "80px" }}
          />

          <input className="input-glass" type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password" />
          <input className="input-glass" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm Password" />

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "กำลังสมัคร..." : "REGISTER"}
          </button>

        </form>

        <p style={{ marginTop: "15px" }}>
          มีบัญชีแล้ว?{" "}
          <Link to="/login" style={{ color: "var(--primary)", fontWeight: "bold" }}>
            Login
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Register;