import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

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

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
        loadProfile(data.user.id);
      }
    };
    getUser();
  }, []);

  const loadProfile = async (userId) => {
    const { data } = await supabase.from("users").select("*").eq("id", userId).maybeSingle();
    if (data) {
      setUsername(data.username || "");
      setFirstname(data.firstname || "");
      setLastname(data.lastname || "");
      setPhone(data.phone || "");
      setAddress(data.address || "");
      setPreview(data.avatar || null);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/") || file.size > 2000000) {
      alert("กรุณาอัปโหลดรูปภาพขนาดไม่เกิน 2MB");
      return;
    }
    try {
      const fileName = `${user.id}_${Date.now()}`;
      const { error } = await supabase.storage.from("avatars").upload(fileName, file);
      if (error) return alert("อัปโหลดไม่สำเร็จ");
      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
      setAvatar(data.publicUrl);
      setPreview(data.publicUrl);
    } catch (err) {
      console.log(err);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("users").upsert({
      id: user.id, email: user.email, username, firstname, lastname, phone, address, avatar: avatar || preview
    });
    if (error) alert("บันทึกไม่สำเร็จ");
    else alert("บันทึกข้อมูลแล้ว");
    setLoading(false);
  };

  return (
    <div className="page-container" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div className="glass-card" style={{ width: "100%", maxWidth: "500px", textAlign: "center" }}>
        
        <h2 style={{ marginBottom: "20px" }}>👤 Personal Settings</h2>

        <div style={{ position: "relative", width: "120px", height: "120px", margin: "0 auto 20px" }}>
          <img
            src={preview || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
            alt="avatar"
            style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", border: "4px solid var(--primary)" }}
          />
          <input 
            type="file" 
            onChange={handleUpload} 
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }} 
            title="เปลี่ยนรูปโปรไฟล์"
          />
        </div>

        <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "20px" }}>
          Profile ID: {user?.id?.slice(0, 10)}
        </p>

        <input type="text" className="input-glass" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <div style={{ display: "flex", gap: "10px" }}>
          <input type="text" className="input-glass" placeholder="Firstname" value={firstname} onChange={(e) => setFirstname(e.target.value)} />
          <input type="text" className="input-glass" placeholder="Lastname" value={lastname} onChange={(e) => setLastname(e.target.value)} />
        </div>
        <input type="email" className="input-glass" value={user?.email || ""} disabled style={{ opacity: 0.7 }} />
        <input type="text" className="input-glass" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input type="text" className="input-glass" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />

        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button className="btn-primary" onClick={saveProfile} disabled={loading} style={{ flex: 1 }}>
            {loading ? "Saving..." : "Save Profile"}
          </button>
          <button className="btn-primary" onClick={() => navigate("/")} style={{ flex: 1, background: "var(--bg-secondary)", color: "var(--text-main)", border: "1px solid var(--card-border)" }}>
            Back
          </button>
        </div>

      </div>
    </div>
  );
}

export default Profile;