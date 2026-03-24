import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

function Profile() {
  const navigate = useNavigate();
  
  // States สำหรับเก็บข้อมูล
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
    const fetchProfile = async () => {
      try {
        // 1. เช็ก Session ผู้ใช้ปัจจุบัน
        const { data: sessionData } = await supabase.auth.getSession();
        const currentUser = sessionData?.session?.user;
        
        if (currentUser) {
          setUser(currentUser);
          
          // 2. ดึงข้อมูลจากตาราง users ของเรา
          const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("id", currentUser.id)
            .single();

          if (data) {
            // โหลดข้อมูลใส่ Form
            setUsername(data.username || "");
            setFirstname(data.firstname || "");
            setLastname(data.lastname || "");
            setPhone(data.phone || "");
            setAddress(data.address || "");
            setPreview(data.avatar || null);
            setAvatar(data.avatar || null);
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      return alert("⚠️ กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น");
    }
    if (file.size > 2000000) {
      return alert("⚠️ กรุณาอัปโหลดรูปภาพขนาดไม่เกิน 2MB");
    }

    try {
      const fileName = `${user.id}_avatar`; // ใช้ชื่อเดิมเสมอเพื่อไม่ให้ไฟล์ขยะล้นถัง
      
      // 🔥 เพิ่ม { upsert: true } เพื่อให้เซฟรูปทับไฟล์เดิมได้
      const { error } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      // ดึงลิงก์ Public URL
      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
      
      // อัปเดต State เพื่อโชว์รูปใหม่ทันที
      // (เติม Date.now() ด้านหลังเพื่อบังคับให้เบราว์เซอร์โหลดรูปใหม่ ไม่ดึงรูปจากแคชเก่า)
      const newAvatarUrl = `${data.publicUrl}?t=${Date.now()}`;
      setAvatar(newAvatarUrl);
      setPreview(newAvatarUrl);

    } catch (err) {
      console.error(err);
      alert("❌ อัปโหลดรูปภาพไม่สำเร็จ: " + err.message);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 🔥 ใช้ .update() แทน .upsert() เพื่อป้องกันการเขียนทับคอลัมน์ role โดยไม่ได้ตั้งใจ
      const { error } = await supabase
        .from("users")
        .update({ 
          username, 
          firstname, 
          lastname, 
          phone, 
          address, 
          avatar: avatar || preview 
        })
        .eq("id", user.id); // อัปเดตเฉพาะ id ของตัวเอง

      if (error) throw error;
      alert("✅ บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว!");
      
    } catch (error) {
      console.error(error);
      alert("❌ บันทึกข้อมูลไม่สำเร็จ: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
      <div className="glass-card" style={{ width: "100%", maxWidth: "550px", textAlign: "center", padding: "40px" }}>
        
        <h2 style={{ marginBottom: "25px", fontSize: "24px" }}>👤 Personal Settings</h2>

        {/* ส่วนรูปโปรไฟล์ */}
        <div style={{ position: "relative", width: "130px", height: "130px", margin: "0 auto 20px" }}>
          <img
            src={preview || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
            alt="avatar"
            style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", border: "4px solid var(--primary)", backgroundColor: "var(--bg-secondary)" }}
          />
          <input 
            type="file" 
            accept="image/*"
            onChange={handleUpload} 
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }} 
            title="คลิกเพื่อเปลี่ยนรูปโปรไฟล์"
          />
          {/* ไอคอนกล้องเล็กๆ มุมขวาล่าง */}
          <div style={{ position: "absolute", bottom: "0px", right: "0px", background: "var(--primary)", color: "white", width: "35px", height: "35px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "16px", pointerEvents: "none", border: "3px solid var(--card-bg)" }}>
            📷
          </div>
        </div>

        <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "30px" }}>
          Profile ID: {user?.id}
        </p>

        {/* ฟอร์มข้อมูล */}
        <div style={{ display: "flex", flexDirection: "column", gap: "15px", textAlign: "left" }}>
          
          <div>
            <label style={{ fontSize: "14px", fontWeight: "bold", marginLeft: "5px", color: "var(--text-muted)" }}>อีเมล (ไม่สามารถเปลี่ยนได้)</label>
            <input type="email" className="input-glass" value={user?.email || ""} disabled style={{ opacity: 0.6, cursor: "not-allowed", marginTop: "5px" }} />
          </div>

          <div>
            <label style={{ fontSize: "14px", fontWeight: "bold", marginLeft: "5px", color: "var(--text-muted)" }}>ชื่อผู้ใช้ (Username)</label>
            <input type="text" className="input-glass" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} style={{ marginTop: "5px" }} />
          </div>

          <div style={{ display: "flex", gap: "15px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "14px", fontWeight: "bold", marginLeft: "5px", color: "var(--text-muted)" }}>ชื่อจริง</label>
              <input type="text" className="input-glass" placeholder="Firstname" value={firstname} onChange={(e) => setFirstname(e.target.value)} style={{ marginTop: "5px" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "14px", fontWeight: "bold", marginLeft: "5px", color: "var(--text-muted)" }}>นามสกุล</label>
              <input type="text" className="input-glass" placeholder="Lastname" value={lastname} onChange={(e) => setLastname(e.target.value)} style={{ marginTop: "5px" }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: "14px", fontWeight: "bold", marginLeft: "5px", color: "var(--text-muted)" }}>เบอร์โทรศัพท์</label>
            <input type="text" className="input-glass" placeholder="08X-XXX-XXXX" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ marginTop: "5px" }} />
          </div>

          <div>
            <label style={{ fontSize: "14px", fontWeight: "bold", marginLeft: "5px", color: "var(--text-muted)" }}>ที่อยู่จัดส่ง</label>
            <textarea 
              className="input-glass" 
              placeholder="กรอกที่อยู่สำหรับจัดส่งสินค้า..." 
              value={address} 
              onChange={(e) => setAddress(e.target.value)} 
              style={{ marginTop: "5px", minHeight: "80px", resize: "vertical" }} 
            />
          </div>

        </div>

        {/* ปุ่มกด */}
        <div style={{ display: "flex", gap: "15px", marginTop: "30px" }}>
          <button className="btn-success" onClick={saveProfile} disabled={loading} style={{ flex: 2, padding: "12px", fontSize: "16px" }}>
            {loading ? "กำลังบันทึกข้อมูล..." : "💾 บันทึกการเปลี่ยนแปลง"}
          </button>
          <button className="btn-primary" onClick={() => navigate("/")} style={{ flex: 1, background: "rgba(100, 116, 139, 0.2)", color: "var(--text-main)", border: "1px solid var(--card-border)" }}>
            กลับหน้าหลัก
          </button>
        </div>

      </div>
    </div>
  );
}

export default Profile;