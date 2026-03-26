import { useState } from "react";
import { supabase } from "../../Backend/config/supabase";
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    // ใช้ sanitizeInput เฉพาะส่วนที่เป็นข้อความธรรมดา
    setFormData({
      ...formData,
      [name]: name === "password" || name === "confirmPassword" ? value : sanitizeInput(value)
    });
  };

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

      // 3. ถ้าสมัครผ่าน (และได้ User ID มา) ให้บันทึกลงตาราง users
      if (data?.user) {
        const { error: dbError } = await supabase.from("users").upsert([
          {
            id: data.user.id,
            email: formData.email.trim(),
            username: formData.username,
            firstname: formData.firstName, // เช็คชื่อ column ให้ตรงกับใน DB นะครับ
            lastname: formData.lastName,
            phone: formData.phone,
            address: formData.address,
            role: "user"
          }
        ]);

        if (dbError) throw dbError;

        alert("🎉 สมัครสมาชิกสำเร็จ!");
        
        // ✅ บังคับเปลี่ยนหน้าและล้างสถานะเดิม (ป้องกันปัญหา Session ค้าง)
        window.location.href = "/"; 
      } else {
        // กรณี Supabase ตั้งค่าให้ยืนยันอีเมล
        alert("📧 กรุณาตรวจสอบอีเมลเพื่อยืนยันการสมัครสมาชิก");
        navigate("/login");
      }

    } catch (err) {
      setErrorMsg("❌ " + err.message);
    } finally {
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
          <input className="input-glass" type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password" />
          <input className="input-glass" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm Password" />

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