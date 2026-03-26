import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { sanitizeInput } from "../utils/sanitize";

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true); // เพิ่มสถานะตอนโหลดข้อมูลครั้งแรก

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setFetching(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData?.session?.user;

      if (!currentUser) return navigate("/login");

      setUser(currentUser);

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle(); // ใช้ maybeSingle เพื่อป้องกัน error ถ้ายังไม่มี row

      if (data) {
        setUsername(data.username || "");
        setFirstname(data.firstname || "");
        setLastname(data.lastname || "");
        setPhone(data.phone || "");
        setAddress(data.address || "");
        setPreview(data.avatar || null);
        setAvatar(data.avatar || null);
      }
    } catch (err) {
      console.error("Fetch profile error:", err);
    } finally {
      setFetching(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return alert("กรุณาเลือกไฟล์รูปภาพ");
    if (file.size > 2 * 1024 * 1024) return alert("รูปภาพต้องมีขนาดไม่เกิน 2MB");

    try {
      setLoading(true);
      const fileName = `${user.id}_avatar`;

      const { error } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const url = data.publicUrl + "?t=" + Date.now();
      setAvatar(url);
      setPreview(url);
      alert("อัปโหลดรูปภาพสำเร็จ ✨");
    } catch (err) {
      alert("อัปโหลดไม่สำเร็จ: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { error } = await supabase
        .from("users")
        .update({
          username: sanitizeInput(username),
          firstname: sanitizeInput(firstname),
          lastname: sanitizeInput(lastname),
          phone: sanitizeInput(phone),
          address: sanitizeInput(address),
          avatar: avatar || preview,
        })
        .eq("id", user.id);

      if (error) throw error;
      alert("✅ บันทึกข้อมูลสำเร็จ");
    } catch (err) {
      alert("บันทึกไม่สำเร็จ: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="page-container" style={{ textAlign: "center", marginTop: "100px" }}>
        <h2 style={{ color: "var(--text-muted)" }}>กำลังโหลดข้อมูลโปรไฟล์... ⏳</h2>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}>
      <div className="glass-card" style={{ width: "100%", maxWidth: "500px", padding: "40px", textAlign: "center" }}>
        
        <h2 style={{ marginBottom: "30px", fontSize: "24px" }}>👤 Personal Settings</h2>

        {/* Avatar Section */}
        <div style={{ position: "relative", width: "130px", height: "130px", margin: "0 auto 25px" }}>
          <img
            src={preview || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
            alt="avatar"
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              objectFit: "cover",
              border: "4px solid var(--primary)",
              boxShadow: "0 0 15px rgba(0,0,0,0.2)"
            }}
          />
          <label 
            style={{ 
              position: "absolute", bottom: "5px", right: "5px", background: "var(--primary)", 
              color: "white", width: "35px", height: "35px", borderRadius: "50%", 
              display: "flex", justifyContent: "center", alignItems: "center", 
              cursor: "pointer", fontSize: "16px", border: "3px solid var(--card-bg)" 
            }}
            title="เปลี่ยนรูปโปรไฟล์"
          >
            📷
            <input type="file" onChange={handleUpload} style={{ display: "none" }} />
          </label>
        </div>

        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "20px" }}>
          ID: {user?.id}
        </p>

        {/* Form Inputs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "15px", textAlign: "left" }}>
          <input
            className="input-glass"
            value={username}
            onChange={(e) => setUsername(sanitizeInput(e.target.value))}
            placeholder="ชื่อผู้ใช้ (Username)"
          />

          <div style={{ display: "flex", gap: "10px" }}>
            <input
              className="input-glass"
              style={{ flex: 1 }}
              value={firstname}
              onChange={(e) => setFirstname(sanitizeInput(e.target.value))}
              placeholder="ชื่อจริง"
            />
            <input
              className="input-glass"
              style={{ flex: 1 }}
              value={lastname}
              onChange={(e) => setLastname(sanitizeInput(e.target.value))}
              placeholder="นามสกุล"
            />
          </div>

          <input
            className="input-glass"
            value={phone}
            onChange={(e) => setPhone(sanitizeInput(e.target.value))}
            placeholder="เบอร์โทรศัพท์"
          />

          <textarea
            className="input-glass"
            value={address}
            onChange={(e) => setAddress(sanitizeInput(e.target.value))}
            placeholder="ที่อยู่จัดส่ง"
            style={{ resize: "vertical", minHeight: "80px" }}
          />

          <div style={{ display: "flex", gap: "15px", marginTop: "15px" }}>
            <button 
              className="btn-success" 
              onClick={saveProfile} 
              disabled={loading}
              style={{ flex: 2, padding: "12px" }}
            >
              {loading ? "กำลังบันทึก..." : "💾 บันทึกข้อมูล"}
            </button>
            <button 
              className="btn-primary" 
              onClick={() => navigate("/")}
              style={{ flex: 1, background: "rgba(100,116,139,0.2)", color: "var(--text-main)", border: "1px solid var(--card-border)" }}
            >
              กลับ
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Profile;