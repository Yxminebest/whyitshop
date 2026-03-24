import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate, Link } from "react-router-dom";

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
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

    // 2. ตรวจสอบรหัสผ่านว่าตรงกันไหม
    if (formData.password !== formData.confirmPassword) {
      return setErrorMsg("❌ รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
    }

    // 🔥 3. ระบบตรวจรหัสผ่าน Strong Password
    // ความหมาย: ยาว 8 ตัวขึ้นไป, มีตัวพิมพ์เล็ก(a-z), ตัวพิมพ์ใหญ่(A-Z), และตัวเลข(0-9)
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    
    if (!strongPasswordRegex.test(formData.password)) {
      return setErrorMsg("⚠️ รหัสผ่านไม่รัดกุม! ต้องมีอย่างน้อย 8 ตัวอักษร ประกอบด้วยตัวพิมพ์เล็ก ตัวพิมพ์ใหญ่ และตัวเลข");
    }

    try {
      setLoading(true);
      
      // 4. ส่งข้อมูลไปสมัครสมาชิกในระบบ Auth ของ Supabase
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password, 
        options: {
          data: {
            full_name: `${formData.firstName} ${formData.lastName}`,
            username: formData.username,
          }
        }
      });

      if (error) throw error;

      // 5. บันทึกข้อมูลทั้งหมดลงตาราง users
      if (data?.user) {
        const { error: dbError } = await supabase.from("users").upsert([
          { 
            id: data.user.id, 
            email: formData.email, 
            username: formData.username,
            firstname: formData.firstName,
            lastname: formData.lastName,
            phone: formData.phone,
            address: formData.address,
            role: "user" 
          }
        ]);
        
        if (dbError) throw new Error("ฐานข้อมูลปฏิเสธการบันทึก: " + dbError.message);
      }

      alert("🎉 สมัครสมาชิกสำเร็จ! เริ่มต้นใช้งานได้เลยครับ");
      navigate("/"); // เด้งไปหน้า Home

    } catch (err) {
      setErrorMsg("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", padding: "40px 20px" }}>
      <div className="glass-card" style={{ width: "100%", maxWidth: "550px", padding: "40px" }}>
        
        <h1 style={{ textAlign: "center", marginBottom: "25px", fontSize: "28px" }}>Create Account 🚀</h1>

        {errorMsg && <div style={{ background: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", padding: "12px", borderRadius: "10px", marginBottom: "20px", fontSize: "14px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>{errorMsg}</div>}

        <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          
          <div style={{ display: "flex", gap: "15px" }}>
            <input type="text" name="firstName" placeholder="First Name (ชื่อจริง)" value={formData.firstName} onChange={handleChange} className="input-glass" required />
            <input type="text" name="lastName" placeholder="Last Name (นามสกุล)" value={formData.lastName} onChange={handleChange} className="input-glass" required />
          </div>

          <input type="text" name="username" placeholder="Username (ชื่อผู้ใช้)" value={formData.username} onChange={handleChange} className="input-glass" required />
          <input type="email" name="email" placeholder="Email Address (อีเมล)" value={formData.email} onChange={handleChange} className="input-glass" required />
          <input type="text" name="phone" placeholder="Phone Number (เบอร์โทรศัพท์)" value={formData.phone} onChange={handleChange} className="input-glass" required />
          
          <textarea 
            name="address" 
            placeholder="Shipping Address (ที่อยู่สำหรับจัดส่งสินค้า)" 
            value={formData.address} 
            onChange={handleChange} 
            className="input-glass" 
            required 
            style={{ minHeight: "80px", resize: "vertical", fontFamily: "inherit" }} 
          />

          <div>
            <input type="password" name="password" placeholder="Password (รหัสผ่าน)" value={formData.password} onChange={handleChange} className="input-glass" required />
            {/* 🔥 เพิ่มข้อความใบ้ผู้ใช้ใต้ช่องรหัสผ่านให้รู้เงื่อนไข */}
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "5px", marginLeft: "5px" }}>
              * รหัสผ่านต้องมี 8 ตัวอักษรขึ้นไป, ประกอบด้วย A-Z, a-z และ 0-9
            </p>
          </div>

          <input type="password" name="confirmPassword" placeholder="Confirm Password (ยืนยันรหัสผ่าน)" value={formData.confirmPassword} onChange={handleChange} className="input-glass" required />

          <button type="submit" disabled={loading} className="btn-success" style={{ padding: "14px", fontSize: "16px", marginTop: "10px" }}>
            {loading ? "กำลังสมัครสมาชิก..." : "REGISTER"}
          </button>

        </form>

        <p style={{ textAlign: "center", marginTop: "20px", color: "var(--text-muted)", fontSize: "14px" }}>
          มีบัญชีอยู่แล้วใช่ไหม?{" "}
          <Link to="/login" style={{ color: "var(--primary)", fontWeight: "bold", textDecoration: "none" }}>
            เข้าสู่ระบบ
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Register;