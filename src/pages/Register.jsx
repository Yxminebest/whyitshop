import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

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

  const handleRegister = async () => {
    if (!firstName || !lastName || !username || !email || !password) return alert("กรุณากรอกข้อมูลให้ครบ");
    if (password.length < 6) return alert("รหัสผ่านต้องอย่างน้อย 6 ตัว");
    if (password !== confirmPassword) return alert("รหัสผ่านไม่ตรงกัน");

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return alert(error.message);

      const user = data?.user || data?.session?.user;
      if (!user) return alert("สมัครสำเร็จ กรุณายืนยันอีเมลก่อน");

      await supabase.from("users").insert([{
        id: user.id, email, username: sanitizeInput(username), firstname: sanitizeInput(firstName), lastname: sanitizeInput(lastName), newsletter, role: "user"
      }]);

      alert("สมัครสมาชิกสำเร็จ 🎉");
      navigate("/login");
    } catch (err) {
      alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div className="glass-card" style={{ width: "100%", maxWidth: "450px", display: "flex", flexDirection: "column", gap: "12px" }}>
        
        <h2 style={{ textAlign: "center", marginBottom: "15px" }}>Create Account</h2>

        <div style={{ display: "flex", gap: "10px" }}>
          <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="input-glass" />
          <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="input-glass" />
        </div>
        
        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="input-glass" />
        <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} className="input-glass" />
        <input type="password" placeholder="Password (ขั้นต่ำ 6 ตัว)" value={password} onChange={(e) => setPassword(e.target.value)} className="input-glass" />
        <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-glass" />

        <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "14px", marginTop: "5px", cursor: "pointer" }}>
          <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} style={{ width: "18px", height: "18px" }} />
          Subscribe to Newsletter
        </label>

        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button onClick={handleRegister} disabled={loading} className="btn-success" style={{ flex: 1 }}>{loading ? "Loading..." : "REGISTER"}</button>
          <button onClick={() => navigate("/login")} className="btn-primary" style={{ flex: 1, background: "var(--bg-secondary)", color: "var(--text-main)", border: "1px solid var(--card-border)" }}>CANCEL</button>
        </div>
        
      </div>
    </div>
  );
}

export default Register;