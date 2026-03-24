import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

// ฟังก์ชันล้างค่า Input ป้องกันการใส่ Script แปลกปลอม
const sanitizeInput = (text) => text?.replace(/[<>]/g, "").replace(/script/gi, "").replace(/['"]/g, "") || "";

function Register() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newsletter, setNewsletter] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    if (e) e.preventDefault(); // ป้องกันหน้า Refresh

    // Validation เบื้องต้น
    if (!firstName || !lastName || !username || !email || !password) {
      return alert("⚠️ กรุณากรอกข้อมูลให้ครบทุกช่อง");
    }
    if (password.length < 6) {
      return alert("🔑 รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
    }
    if (password !== confirmPassword) {
      return alert("❌ รหัสผ่านทั้งสองช่องไม่ตรงกัน");
    }

    try {
      setLoading(true);

      // 1. สมัครสมาชิกในระบบ Auth ของ Supabase
      const { data, error: authError } = await supabase.auth.signUp({ 
        email: email.trim(), 
        password: password 
      });

      if (authError) throw authError;

      const user = data?.user;

      // 2. บันทึกข้อมูลเพิ่มเติมลงในตาราง users
      if (user) {
        const { error: dbError } = await supabase.from("users").insert([{
          id: user.id, 
          email: email.trim(), 
          username: sanitizeInput(username), 
          firstname: sanitizeInput(firstName), 
          lastname: sanitizeInput(lastName), 
          newsletter, 
          role: "user" // ค่าเริ่มต้นเป็น user เสมอ
        }]);

        if (dbError) throw dbError;

        alert("สมัครสมาชิกสำเร็จเรียบร้อย! 🎉");
        navigate("/login");
      } else {
        // กรณีที่ Supabase ตั้งค่าให้ต้องยืนยันอีเมลก่อน (Email Confirmation)
        alert("สมัครสำเร็จ! กรุณาตรวจสอบอีเมลของคุณเพื่อยืนยันการใช้งาน 📧");
        navigate("/login");
      }

    } catch (err) {
      alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: '85vh' }}>
      <form 
        onSubmit={handleRegister}
        className="glass-card" 
        style={{ width: "100%", maxWidth: "480px", display: "flex", flexDirection: "column", gap: "15px", padding: '40px' }}
      >
        
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>Create Account</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>ร่วมเป็นส่วนหนึ่งของ WHY IT Shop วันนี้</p>
        </div>

        <div style={{ display: "flex", gap: "15px" }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '5px' }}>First Name</label>
            <input type="text" placeholder="ชื่อ" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="input-glass" required />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '5px' }}>Last Name</label>
            <input type="text" placeholder="นามสกุล" value={lastName} onChange={(e) => setLastName(e.target.value)} className="input-glass" required />
          </div>
        </div>
        
        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '5px' }}>Username</label>
          <input type="text" placeholder="ตั้งชื่อผู้ใช้ของคุณ" value={username} onChange={(e) => setUsername(e.target.value)} className="input-glass" required />
        </div>

        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '5px' }}>Email Address</label>
          <input type="email" placeholder="example@mail.com" value={email} onChange={(e) => setEmail(e.target.value)} className="input-glass" required />
        </div>

        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '5px' }}>Password</label>
          <input type="password" placeholder="อย่างน้อย 6 ตัวอักษร" value={password} onChange={(e) => setPassword(e.target.value)} className="input-glass" required />
        </div>

        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '5px' }}>Confirm Password</label>
          <input type="password" placeholder="กรอกรหัสผ่านอีกครั้ง" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-glass" required />
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-main)", fontSize: "14px", marginTop: "5px", cursor: "pointer" }}>
          <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} style={{ width: "18px", height: "18px", cursor: 'pointer' }} />
          รับข่าวสารและโปรโมชั่นพิเศษจากเรา
        </label>

        <div style={{ display: "flex", gap: "15px", marginTop: "20px" }}>
          <button type="submit" disabled={loading} className="btn-success" style={{ flex: 2, padding: '14px', fontWeight: '800' }}>
            {loading ? "กำลังบันทึก..." : "REGISTER"}
          </button>
          <button type="button" onClick={() => navigate("/login")} className="btn-primary" style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid var(--card-border)" }}>
            CANCEL
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: '13px', marginTop: '10px', color: 'var(--text-muted)' }}>
          มีบัญชีอยู่แล้ว? <span onClick={() => navigate('/login')} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold' }}>เข้าสู่ระบบ</span>
        </p>
        
      </form>
    </div>
  );
}

export default Register;