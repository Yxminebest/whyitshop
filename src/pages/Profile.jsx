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

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUser = sessionData?.session?.user;

    if (!currentUser) return navigate("/login");

    setUser(currentUser);

    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", currentUser.id)
      .single();

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
    if (!file || !file.type.startsWith("image/")) {
      return alert("กรุณาเลือกไฟล์รูปภาพ");
    }

    const fileName = `${user.id}_avatar`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true });

    if (error) return alert("อัปโหลดไม่สำเร็จ");

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    const url = data.publicUrl + "?t=" + Date.now();
    setAvatar(url);
    setPreview(url);
  };

  const saveProfile = async () => {
    if (!user) return;

    setLoading(true);

    await supabase
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

    alert("บันทึกสำเร็จ");
    setLoading(false);
  };

  return (
    <div className="page-container">
      <div className="glass-card" style={{ maxWidth: "500px", margin: "auto", textAlign: "center" }}>
        
        <h2 style={{ marginBottom: "20px" }}>👤 Personal Settings</h2>

        {/* Avatar */}
        <div style={{ marginBottom: "20px" }}>
          <img
            src={preview || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
            alt="avatar"
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              marginBottom: "10px"
            }}
          />
          <input type="file" onChange={handleUpload} />
        </div>

        <p style={{ fontSize: "13px", marginBottom: "10px" }}>
          Profile ID: {user?.id}
        </p>

        {/* INPUTS */}
        <input
          className="input-glass"
          value={username}
          onChange={(e) => setUsername(sanitizeInput(e.target.value))}
          placeholder="Username"
        />

        <input
          className="input-glass"
          value={firstname}
          onChange={(e) => setFirstname(sanitizeInput(e.target.value))}
          placeholder="Firstname"
        />

        <input
          className="input-glass"
          value={lastname}
          onChange={(e) => setLastname(sanitizeInput(e.target.value))}
          placeholder="Lastname"
        />

        <input
          className="input-glass"
          value={phone}
          onChange={(e) => setPhone(sanitizeInput(e.target.value))}
          placeholder="Phone"
        />

        <textarea
          className="input-glass"
          value={address}
          onChange={(e) => setAddress(sanitizeInput(e.target.value))}
          placeholder="Address"
          style={{ resize: "none", height: "80px" }}
        />

        <button className="btn-success" onClick={saveProfile}>
          {loading ? "กำลังบันทึก..." : "💾 Save"}
        </button>

        <button className="btn-primary" onClick={() => navigate("/")}>
          กลับหน้าหลัก
        </button>

      </div>
    </div>
  );
}

export default Profile;