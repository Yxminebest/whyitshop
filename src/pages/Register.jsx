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

  // sanitize 
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

    //  check required
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

    // confirm password
    if (formData.password !== formData.confirmPassword) {
      return setErrorMsg("❌ รหัสผ่านไม่ตรงกัน");
    }

    // strong password
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!strongPasswordRegex.test(formData.password)) {
      return setErrorMsg("⚠️ รหัสผ่านต้องมี A-Z, a-z และตัวเลข");
    }

    try {
      setLoading(true);

      // สมัคร auth
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

      // insert DB พร้อม sanitize
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
    <div className="page-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
      <div className="glass-card" style={{ width: "100%", maxWidth: "550px", padding: "40px" }}>
        
        <h1>Create Account 🚀</h1>

        {errorMsg && <div>{errorMsg}</div>}

        <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          
          <input name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First Name" required />
          <input name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last Name" required />
          <input name="username" value={formData.username} onChange={handleChange} placeholder="Username" required />
          <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email" required />
          <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" required />
          
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Address"
            required
          />

          <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password" required />
          <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm Password" required />

          <button type="submit" disabled={loading}>
            {loading ? "กำลังสมัคร..." : "REGISTER"}
          </button>

        </form>

        <p>
          มีบัญชีแล้ว? <Link to="/login">Login</Link>
        </p>

      </div>
    </div>
  );
}

export default Register;