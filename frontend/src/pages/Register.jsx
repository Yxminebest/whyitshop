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

  // ✅ ตรวจสอบว่า password เป็น Strong หรือไม่
  const isPasswordStrong = passwordStrength.strength >= 4;

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

    // ✅ บังคับให้เป็น Strong password (level 4 หรือ 5)
    if (!isPasswordStrong) {
      return setErrorMsg("⚠️ รหัสผ่านต้องเป็น 'Strong' ขึ้นไป (ต้องมี ตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก ตัวเลข และอักขระพิเศษ)");
    }

    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!strongPasswordRegex.test(formData.password)) {
      return setErrorMsg("⚠️ รหัสผ่านต้องมี 8 ตัวขึ้นไป และมี A-Z, a-z, 0-9");
    }

    try {
      setLoading(true);

      // 2. สมัครสมาชิกใน Auth
      // ⚠️ Email verification ปิดชั่วคราว (rate limit exceeded)
      // จะเปิดใหม่เมื่อเพิ่มธรรมชาติ SendGrid
      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            full_name: `${formData.firstName} ${formData.lastName}`,
            username: formData.username,
            firstname: formData.firstName,
            lastname: formData.lastName,
            phone: formData.phone,
            address: formData.address
          }
        }
      });

      if (error) throw error;

      // ✅ Trigger จะ auto create users record เมื่อมี auth.users ใหม่
      if (data?.user) {
        // ✅ Send welcome email via backend (fire and forget - ไม่ block registration)
        // ใช้ setTimeout เพื่อส่งแบบ async
        setTimeout(async () => {
          try {
            // ใช้ /api path ธรรมดา Vite proxy จะ forward ไป localhost:5000
            const emailResponse = await fetch('/api/auth/send-welcome-email', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                email: formData.email,
                firstName: formData.firstName
              })
            });
            if (emailResponse.ok) {
              console.log('✅ Welcome email sent successfully');
            } else {
              console.log('Email API returned:', emailResponse.status);
            }
          } catch (emailErr) {
            console.log('Email send error (non-blocking):', emailErr.message);
          }
        }, 100); // Send email after 100ms

        // ✅ แสดง message สมัครสำเร็จ
        alert("✅ สมัครสมาชิกสำเร็จ!\n\nกรุณา Login เข้าสู่ระบบ");
        navigate("/login");
      } else {
        alert("⚠️ ไม่สามารถสมัครสมาชิกได้ กรุณาลองใหม่");
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

          {/* Password Strength Indicator with Details */}
          {formData.password && (
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              fontSize: "12px",
              color: "var(--text-muted)",
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}>
                <div style={{
                  flex: 1,
                  height: "6px",
                  background: "var(--bg-secondary)",
                  borderRadius: "3px",
                  overflow: "hidden",
                }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${(passwordStrength.strength / 5) * 100}%`,
                      background: passwordStrength.color,
                      transition: "all 0.3s ease",
                      boxShadow: `0 0 8px ${passwordStrength.color}`,
                    }}
                  />
                </div>
                <span style={{ color: passwordStrength.color, fontWeight: "700", minWidth: "80px", textAlign: "right" }}>
                  {passwordStrength.label}
                  {isPasswordStrong && " ✅"}
                </span>
              </div>
              
              {/* Requirements checklist */}
              <div style={{ background: "rgba(0,0,0,0.1)", padding: "8px 12px", borderRadius: "6px", fontSize: "11px" }}>
                <p style={{ margin: "0 0 6px 0", fontWeight: "600" }}>ความยาว:</p>
                <div style={{ marginLeft: "8px", display: "flex", gap: "4px", alignItems: "center" }}>
                  <span style={{ color: formData.password.length >= 8 ? "#22c55e" : "#ff4757" }}>
                    {formData.password.length >= 8 ? "✅" : "❌"}
                  </span>
                  <span>อย่างน้อย 8 ตัวอักษร ({formData.password.length}/8)</span>
                </div>
                
                <p style={{ margin: "6px 0 6px 0", fontWeight: "600" }}>ตัวอักษร:</p>
                <div style={{ marginLeft: "8px", display: "flex", flexDirection: "column", gap: "2px" }}>
                  <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                    <span style={{ color: /[a-z]/.test(formData.password) ? "#22c55e" : "#ff4757" }}>
                      {/[a-z]/.test(formData.password) ? "✅" : "❌"}
                    </span>
                    <span>ตัวอักษรตัวเล็ก (a-z)</span>
                  </div>
                  <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                    <span style={{ color: /[A-Z]/.test(formData.password) ? "#22c55e" : "#ff4757" }}>
                      {/[A-Z]/.test(formData.password) ? "✅" : "❌"}
                    </span>
                    <span>ตัวอักษรตัวใหญ่ (A-Z)</span>
                  </div>
                  <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                    <span style={{ color: /\d/.test(formData.password) ? "#22c55e" : "#ff4757" }}>
                      {/\d/.test(formData.password) ? "✅" : "❌"}
                    </span>
                    <span>ตัวเลข (0-9)</span>
                  </div>
                  <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                    <span style={{ color: /[^a-zA-Z\d]/.test(formData.password) ? "#22c55e" : "#999" }}>
                      {/[^a-zA-Z\d]/.test(formData.password) ? "✅" : "○"}
                    </span>
                    <span style={{ color: /[^a-zA-Z\d]/.test(formData.password) ? "#22c55e" : "#999" }}>
                      อักขระพิเศษ (!@#$%...) <span style={{ fontSize: "10px" }}>(ทำให้เป็น Very Strong)</span>
                    </span>
                  </div>
                </div>
              </div>
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

          <button 
            className="btn-primary" 
            type="submit" 
            disabled={loading || !isPasswordStrong}
            style={{ 
              padding: "15px", 
              marginTop: "10px",
              opacity: (!isPasswordStrong && formData.password) ? 0.5 : 1,
              cursor: (!isPasswordStrong && formData.password) ? "not-allowed" : "pointer"
            }}
            title={!isPasswordStrong && formData.password ? "กรุณาใช้ Strong password" : ""}
          >
            {loading ? "กำลังสมัคร..." : (formData.password && !isPasswordStrong ? "⚠️ รอให้ password เป็น Strong" : "REGISTER NOW")}
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