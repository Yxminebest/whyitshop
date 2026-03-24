import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // 1. นำเข้า useAuth

function Profile() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth(); // 2. ดึง user และ loading จาก Context
  
  const [username, setUsername] = useState("");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!user) return; // ถ้ายูสเซอร์ยังไม่โหลด ให้รอ
      
      try {
        setFetching(true);
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (data && isMounted) {
          setUsername(data.username || "");
          setFirstname(data.firstname || "");
          setLastname(data.lastname || "");
          setPhone(data.phone || "");
          setAddress(data.address || "");
          setPreview(data.avatar || null);
          setAvatar(data.avatar || null);
        }
      } catch (err) {
        console.error("Load profile error:", err.message);
      } finally {
        if (isMounted) setFetching(false);
      }
    };

    loadProfile();

    return () => { isMounted = false; };
  }, [user]); // 3. รันใหม่เมื่อ user จาก Context เปลี่ยนแปลง

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/") || file.size > 2000000) {
      alert("กรุณาอัปโหลดรูปภาพขนาดไม่เกิน 2MB");
      return;
    }

    try {
      setSaving(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
      setAvatar(data.publicUrl);
      setPreview(data.publicUrl);
      alert("อัปโหลดรูปโปรไฟล์เรียบร้อย!");
    } catch (err) {
      alert("อัปโหลดไม่สำเร็จ: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("users").upsert({
        id: user.id,
        email: user.email,
        username,
        firstname,
        lastname,
        phone,
        address,
        avatar: avatar
      });

      if (error) throw error;
      alert("บันทึกข้อมูลเรียบร้อยแล้ว ✨");
    } catch (err) {
      alert("บันทึกไม่สำเร็จ: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // แสดงหน้า Loading ถ้า AuthContext ยังเช็กยูสเซอร์ไม่เสร็จ
  if (authLoading || (fetching && user)) {
    return <div style={{ color: "white", textAlign: "center", padding: "100px" }}>กำลังโหลดข้อมูลโปรไฟล์...</div>;
  }

  return (
    <div className="page-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
      <div className="glass-card" style={{ width: "100%", maxWidth: "550px", textAlign: "center", padding: "40px" }}>
        
        <h2 style={{ marginBottom: "30px", fontWeight: "800" }}>👤 Personal Settings</h2>

        <div style={{ position: "relative", width: "130px", height: "130px", margin: "0 auto 10px" }}>
          <img
            src={preview || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
            alt="avatar"
            style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", border: "4px solid var(--primary)", boxShadow: "0 0 15px var(--primary)" }}
          />
          <div style={{ 
            position: "absolute", bottom: "5px", right: "5px", background: "var(--primary)", 
            borderRadius: "50%", width: "35px", height: "35px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" 
          }}>
            📷
            <input 
              type="file" 
              onChange={handleUpload} 
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }} 
            />
          </div>
        </div>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "20px" }}>กดที่รูปเพื่อเปลี่ยนโปรไฟล์</p>

        <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "15px" }}>
          <div>
            <label style={{ fontSize: "14px", color: "var(--text-muted)" }}>Username</label>
            <input type="text" className="input-glass" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>

          <div style={{ display: "flex", gap: "15px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "14px", color: "var(--text-muted)" }}>Firstname</label>
              <input type="text" className="input-glass" placeholder="Firstname" value={firstname} onChange={(e) => setFirstname(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "14px", color: "var(--text-muted)" }}>Lastname</label>
              <input type="text" className="input-glass" placeholder="Lastname" value={lastname} onChange={(e) => setLastname(e.target.value)} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: "14px", color: "var(--text-muted)" }}>Email (ไม่สามารถแก้ไขได้)</label>
            <input type="email" className="input-glass" value={user?.email || ""} disabled style={{ opacity: 0.5, cursor: "not-allowed" }} />
          </div>

          <div>
            <label style={{ fontSize: "14px", color: "var(--text-muted)" }}>Phone Number</label>
            <input type="text" className="input-glass" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div>
            <label style={{ fontSize: "14px", color: "var(--text-muted)" }}>Address</label>
            <textarea 
              className="input-glass" 
              placeholder="Address" 
              value={address} 
              onChange={(e) => setAddress(e.target.value)} 
              style={{ height: "80px", paddingTop: "10px", resize: "none" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "15px", marginTop: "30px" }}>
          <button className="btn-success" onClick={saveProfile} disabled={saving} style={{ flex: 2, padding: "12px" }}>
            {saving ? "กำลังบันทึก..." : "💾 Save Changes"}
          </button>
          <button className="btn-primary" onClick={() => navigate("/")} style={{ flex: 1, background: "rgba(255,255,255,0.1)", border: "1px solid var(--card-border)" }}>
            Back
          </button>
        </div>

      </div>
    </div>
  );
}

export default Profile;