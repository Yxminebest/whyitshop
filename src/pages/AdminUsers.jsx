import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdmin();
    fetchUsers();
  }, []);

  // 1. ตรวจสอบสิทธิ์ Admin อย่างเข้มงวด
  const checkAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate("/login");

      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (error || data?.role !== "admin") {
        alert("คุณไม่มีสิทธิ์เข้าถึงหน้านี้ ❌");
        navigate("/");
      }
    } catch (err) {
      navigate("/");
    }
  };

  // 2. ดึงข้อมูล User ทั้งหมด (ต้องรัน SQL RLS ที่ผมให้ไว้ก่อนหน้าด้วยนะ)
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error("Fetch error:", err.message);
      // ถ้า Error 403 แสดงว่ายังไม่ได้ตั้งค่า RLS ใน Supabase
    } finally {
      setLoading(false);
    }
  };

  // 3. เปลี่ยนสิทธิ์ผู้ใช้ (User <-> Admin)
  const toggleRole = async (id, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (!window.confirm(`⚠️ ยืนยันการเปลี่ยนสิทธิ์เป็น ${newRole.toUpperCase()}?`)) return;

    const { error } = await supabase.from("users").update({ role: newRole }).eq("id", id);
    if (error) alert("❌ เปลี่ยน Role ไม่สำเร็จ: " + error.message);
    else fetchUsers();
  };

  // 4. ลบข้อมูลผู้ใช้จากตาราง public.users
  const deleteUser = async (id) => {
    if (!window.confirm("🚨 คุณแน่ใจหรือไม่ที่จะลบผู้ใช้นี้? (ข้อมูลโปรไฟล์จะหายไปทั้งหมด)")) return;

    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) alert("❌ ลบไม่สำเร็จ: " + error.message);
    else fetchUsers();
  };

  // 5. บันทึกการแก้ไข Username/Phone แบบ Inline
  const saveEdit = async () => {
    if (!editingUser) return;
    const { error } = await supabase
      .from("users")
      .update({
        username: editingUser.username,
        phone: editingUser.phone,
      })
      .eq("id", editingUser.id);

    if (error) alert("❌ บันทึกไม่สำเร็จ");
    else {
      setEditingUser(null);
      fetchUsers();
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: "1100px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "800" }}>👥 Manage Users</h1>
        <button onClick={fetchUsers} className="btn-primary" style={{ padding: "10px 20px", fontSize: "14px" }}>
          🔄 รีเฟรชข้อมูล
        </button>
      </div>

      <div className="glass-card" style={{ padding: "0", overflow: "hidden", border: "1px solid var(--card-border)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.05)", borderBottom: "2px solid var(--card-border)" }}>
                <th style={{ padding: "20px" }}>Email Address</th>
                <th style={{ padding: "20px" }}>Username</th>
                <th style={{ padding: "20px" }}>Phone</th>
                <th style={{ padding: "20px" }}>Role</th>
                <th style={{ padding: "20px", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ padding: "50px", textAlign: "center", color: "var(--text-muted)" }}>
                    กำลังโหลดข้อมูลผู้ใช้... ⏳
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: "50px", textAlign: "center", color: "var(--danger)" }}>
                    ไม่พบข้อมูลผู้ใช้ในระบบ
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid var(--card-border)", transition: "0.3s" }} className="table-row-hover">
                    <td style={{ padding: "15px 20px" }}>
                      <span style={{ fontSize: "14px", fontWeight: "500" }}>{u.email}</span>
                    </td>
                    
                    <td style={{ padding: "15px 20px" }}>
                      {editingUser?.id === u.id ? (
                        <input
                          className="input-glass"
                          style={{ margin: 0, padding: "8px", fontSize: "14px" }}
                          value={editingUser.username || ""}
                          onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                        />
                      ) : (
                        <span style={{ color: u.username ? "inherit" : "var(--text-muted)" }}>
                          {u.username || "ยังไม่ได้ตั้งชื่อ"}
                        </span>
                      )}
                    </td>

                    <td style={{ padding: "15px 20px" }}>
                      {editingUser?.id === u.id ? (
                        <input
                          className="input-glass"
                          style={{ margin: 0, padding: "8px", fontSize: "14px" }}
                          value={editingUser.phone || ""}
                          onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                        />
                      ) : (
                        u.phone || "-"
                      )}
                    </td>

                    <td style={{ padding: "15px 20px" }}>
                      <span style={{ 
                        background: u.role === "admin" ? "rgba(34, 197, 94, 0.2)" : "rgba(255,255,255,0.05)", 
                        color: u.role === "admin" ? "#22c55e" : "var(--text-muted)", 
                        padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold",
                        border: u.role === "admin" ? "1px solid #22c55e" : "1px solid var(--card-border)"
                      }}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>

                    <td style={{ padding: "15px 20px" }}>
                      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                        {editingUser?.id === u.id ? (
                          <>
                            <button onClick={saveEdit} className="btn-success" style={{ padding: "6px 15px", fontSize: "12px" }}>Save</button>
                            <button onClick={() => setEditingUser(null)} className="btn-primary" style={{ padding: "6px 15px", fontSize: "12px", background: "var(--bg-secondary)" }}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => setEditingUser(u)} className="btn-primary" style={{ padding: "6px 12px", fontSize: "12px" }}>Edit</button>
                            <button onClick={() => toggleRole(u.id, u.role)} className="btn-success" style={{ padding: "6px 12px", fontSize: "12px", background: "transparent", border: "1px solid var(--success)", color: "var(--success)" }}>Role</button>
                            <button onClick={() => deleteUser(u.id)} className="btn-primary" style={{ padding: "6px 12px", fontSize: "12px", background: "var(--danger)" }}>Delete</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminUsers;