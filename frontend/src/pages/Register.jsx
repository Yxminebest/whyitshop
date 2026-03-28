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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // ใช้ sanitizeInput เฉพาะส่วนที่เป็นข้อความธรรมดา
    setFormData({
      ...formData,
      [name]: name === "password" || name === "confirmPassword" ? value : sanitizeInput(value)
    });
  };

  // ✅ ฟังก์ชันเช็ค password strength
  const checkPasswordStrength = (pwd) => {
    if (!pwd) return { strength: 0, label: "", color: "" };
    
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z\d]/.test(pwd)) strength++;

    const strengthMap = {
      1: { label: "Very Weak", color: "#ff4757" },
      2: { label: "Weak", color: "#ffa502" },
      3: { label: "Medium", color: "#ffd93d" },
      4: { label: "Strong", color: "#6bcf7f" },
      5: { label: "Very Strong", color: "#00b074" }
    };

    return { strength, ...strengthMap[strength] };
  };

  const passwordStrength = checkPasswordStrength(formData.password);

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    // 1. Validation (โค้ดเดิมของคุณดีอยู่แล้ว)
    if (!formData.firstName || !formData.lastName || !formData.username || 
        !formData.email || !formData.phone || !formData.address || !formData.password) {
      return setErrorMsg("⚠️ กรุณากรอกข้อมูลให้ครบทุกช่อง");
    }

    if (formData.password !== formData.confirmPassword) {
      return setErrorMsg("❌ รหัสผ่านไม่ตรงกัน");
    }

    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!strongPasswordRegex.test(formData.password)) {
      return setErrorMsg("⚠️ รหัสผ่านต้องมี 8 ตัวขึ้นไป และมี A-Z, a-z, 0-9");
    }

    try {
      setLoading(true);

      // 2. สมัครสมาชิกใน Auth
      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim(),
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
        // ✅ บันทึกข้อมูล user ลงตาราง users (ครบตามโครงสร้าง)
        const { error: insertError } = await supabase
          .from("users")
          .insert([
            {
              id: data.user.id,
              email: formData.email.trim(),
              username: formData.username,
              firstname: formData.firstName,
              lastname: formData.lastName,
              phone: formData.phone,
              address: formData.address,
              role: "user",
              newsletter: false,
              avatar: null
            }
          ]);

        if (insertError) {
          console.error("Insert user error:", insertError);
          throw insertError;
        }

        alert("🎉 สมัครสมาชิกสำเร็จ!");
        window.location.href = "/"; 
      } else {
        alert("📧 กรุณาตรวจสอบอีเมลเพื่อยืนยันการสมัครสมาชิก");
        navigate("/login");
      }

    } catch (err) {
      setErrorMsg("❌ " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "90vh" }}>
      <div className="glass-card" style={{ width: "100%", maxWidth: "500px", textAlign: "center", padding: "40px" }}>
        <h1 style={{ marginBottom: "20px" }}>Create Account 🚀</h1>

        {errorMsg && <div style={{ color: "#ff4d4f", marginBottom: "15px", fontWeight: "bold" }}>{errorMsg}</div>}

        <form style={{ display: "flex", flexDirection: "column", gap: "12px" }} onSubmit={handleRegister}>
          <div style={{ display: "flex", gap: "10px" }}>
            <input className="input-glass" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First Name" style={{flex: 1}} />
            <input className="input-glass" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last Name" style={{flex: 1}} />
          </div>
          <input className="input-glass" name="username" value={formData.username} onChange={handleChange} placeholder="Username" />
          <input className="input-glass" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" />
          <input className="input-glass" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" />
          <textarea className="input-glass" name="address" value={formData.address} onChange={handleChange} placeholder="Address" style={{ resize: "none", height: "80px" }} />
          
          {/* Password Field with Show/Hide */}
          <div style={{ position: "relative" }}>
            <input
              className="input-glass"
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password (ต้องมี 8 ตัว, A-Z, a-z, 0-9)"
              style={{ paddingRight: "40px" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: "18px",
                color: "var(--text-muted)",
                padding: "4px 8px",
                transition: "0.3s",
              }}
              onMouseEnter={(e) => e.target.style.color = "var(--primary)"}
              onMouseLeave={(e) => e.target.style.color = "var(--text-muted)"}
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>

          {/* Password Strength Indicator */}
          {formData.password && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "12px",
              color: "var(--text-muted)",
            }}>
              <div style={{
                flex: 1,
                height: "4px",
                background: "var(--bg-secondary)",
                borderRadius: "2px",
                overflow: "hidden",
              }}>
                <div
                  style={{
                    height: "100%",
                    width: `${(passwordStrength.strength / 5) * 100}%`,
                    background: passwordStrength.color,
                    transition: "all 0.3s ease",
                  }}
                />
              </div>
              <span style={{ color: passwordStrength.color, fontWeight: "600", minWidth: "60px" }}>
                {passwordStrength.label}
              </span>
            </div>
          )}

          {/* Confirm Password Field with Show/Hide */}
          <div style={{ position: "relative" }}>
            <input
              className="input-glass"
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm Password"
              style={{ paddingRight: "40px" }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: "18px",
                color: "var(--text-muted)",
                padding: "4px 8px",
                transition: "0.3s",
              }}
              onMouseEnter={(e) => e.target.style.color = "var(--primary)"}
              onMouseLeave={(e) => e.target.style.color = "var(--text-muted)"}
            >
              {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>

          <button className="btn-primary" type="submit" disabled={loading} style={{ padding: "15px", marginTop: "10px" }}>
            {loading ? "กำลังสมัคร..." : "REGISTER NOW"}
          </button>
        </form>

        <p style={{ marginTop: "15px" }}>
          มีบัญชีแล้ว? <Link to="/login" style={{ color: "var(--primary)", fontWeight: "bold" }}>Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;