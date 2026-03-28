import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL; // http://localhost:5000/api

function AdminUsers() {
  const navigate = useNavigate();
  const { user: authUser, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("user");

  useEffect(() => {
    checkAdmin();
  }, [authUser]);

  useEffect(() => {
    if (!authLoading && authUser) {
      fetchUsers();
    }
  }, [authUser, authLoading]);

  const checkAdmin = async () => {
    if (!authUser?.id) {
      navigate("/login");
      return;
    }

    try {
      const { data } = await supabase.from("users").select("role").eq("id", authUser.id).maybeSingle();
      const role = data?.role || "user";
      setUserRole(role);
      
      if (role !== "admin") {
        alert("❌ คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
        navigate("/");
      }
    } catch (err) {
      console.error("Admin check error:", err);
      navigate("/");
    }
  };

  // เรียกผ่าน Backend แทน Supabase โดยตรง
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/users`);
      const data = await res.json();
      setUsers(data || []);
    } catch (err) {
      console.error("Fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = async (id, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (!window.confirm(`⚠️ ยืนยันการเปลี่ยนสิทธิ์เป็น ${newRole.toUpperCase()}?`)) return;

    try {
      const res = await fetch(`${API_URL}/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) fetchUsers();
    } catch (err) {
      alert("❌ เปลี่ยน Role ไม่สำเร็จ");
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("🚨 คุณแน่ใจหรือไม่ที่จะลบผู้ใช้นี้?")) return;
    try {
      const res = await fetch(`${API_URL}/users/${id}`, { method: "DELETE" });
      if (res.ok) fetchUsers();
    } catch (err) {
      alert("❌ ลบไม่สำเร็จ");
    }
  };

  const saveEdit = async () => {
    if (!editingUser) return;
    try {
      const res = await fetch(`${API_URL}/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: editingUser.username,
          phone: editingUser.phone,
        }),
      });
      if (res.ok) {
        setEditingUser(null);
        fetchUsers();
      }
    } catch (err) {
      alert("❌ บันทึกไม่สำเร็จ");
    }
  };

  return (
    <div className="page-container">
      <h1 style={{ marginBottom: "30px", fontSize: "32px", fontWeight: "800" }}>👥 Manage Users</h1>

      {loading ? (
        <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>
          ⏳ Loading users...
        </div>
      ) : users.length === 0 ? (
        <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>
          No users found
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "var(--card-bg)",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
          }}>
            <thead>
              <tr style={{ background: "var(--primary)", color: "white" }}>
                <th style={{ padding: "15px", textAlign: "left", fontWeight: "bold" }}>Email</th>
                <th style={{ padding: "15px", textAlign: "left", fontWeight: "bold" }}>Username</th>
                <th style={{ padding: "15px", textAlign: "left", fontWeight: "bold" }}>Phone</th>
                <th style={{ padding: "15px", textAlign: "center", fontWeight: "bold" }}>Role</th>
                <th style={{ padding: "15px", textAlign: "center", fontWeight: "bold" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  style={{
                    borderBottom: "1px solid var(--card-border)",
                    hover: { background: "var(--bg-secondary)" }
                  }}
                >
                  <td style={{ padding: "15px" }}>
                    <span style={{ fontSize: "14px" }}>{user.email}</span>
                  </td>
                  <td style={{ padding: "15px" }}>
                    {editingUser?.id === user.id ? (
                      <input
                        value={editingUser.username}
                        onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                        style={{
                          padding: "8px",
                          borderRadius: "6px",
                          border: "1px solid var(--card-border)",
                          background: "var(--bg-secondary)",
                          color: "var(--text-main)",
                          width: "100%"
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: "14px" }}>{user.username || "-"}</span>
                    )}
                  </td>
                  <td style={{ padding: "15px" }}>
                    {editingUser?.id === user.id ? (
                      <input
                        value={editingUser.phone}
                        onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                        style={{
                          padding: "8px",
                          borderRadius: "6px",
                          border: "1px solid var(--card-border)",
                          background: "var(--bg-secondary)",
                          color: "var(--text-main)",
                          width: "100%"
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: "14px" }}>{user.phone || "-"}</span>
                    )}
                  </td>
                  <td style={{ padding: "15px", textAlign: "center" }}>
                    <span
                      style={{
                        background: user.role === "admin" ? "var(--primary)" : "#2ed573",
                        color: "white",
                        padding: "6px 12px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "bold"
                      }}
                    >
                      {user.role?.toUpperCase() || "USER"}
                    </span>
                  </td>
                  <td style={{ padding: "15px", textAlign: "center", display: "flex", gap: "8px", justifyContent: "center" }}>
                    {editingUser?.id === user.id ? (
                      <>
                        <button
                          onClick={saveEdit}
                          style={{
                            background: "#2ed573",
                            color: "white",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "bold",
                            fontSize: "12px"
                          }}
                        >
                          ✅ Save
                        </button>
                        <button
                          onClick={() => setEditingUser(null)}
                          style={{
                            background: "var(--card-border)",
                            color: "var(--text-main)",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "bold",
                            fontSize: "12px"
                          }}
                        >
                          ❌ Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingUser(user)}
                          style={{
                            background: "var(--primary)",
                            color: "white",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "bold",
                            fontSize: "12px"
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => toggleRole(user.id, user.role)}
                          style={{
                            background: "#ffa502",
                            color: "white",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "bold",
                            fontSize: "12px"
                          }}
                        >
                          🔄 Role
                        </button>
                        <button
                          onClick={() => deleteUser(user.id)}
                          style={{
                            background: "#ff4757",
                            color: "white",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "bold",
                            fontSize: "12px"
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;