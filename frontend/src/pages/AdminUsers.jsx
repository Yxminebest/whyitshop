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
  const [page, setPage] = useState(1); // ✅ pagination
  const [pageSize] = useState(10); // Show 10 users per page
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    checkAdmin();
  }, [authUser]);

  useEffect(() => {
    if (!authLoading && authUser) {
      fetchUsers();
    }
  }, [authUser, authLoading, page]); // ✅ fetch when page changes

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

  // ✅ Fetch with pagination
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const offset = (page - 1) * pageSize;
      const res = await fetch(`${API_URL}/users?limit=${pageSize}&offset=${offset}`);
      
      // Check if response is HTML (error) or JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Server error: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      
      // Handle response - expect { users: [], total: count }
      if (data && data.users && typeof data.total === 'number') {
        setUsers(data.users);
        setTotalUsers(data.total);
      } else if (Array.isArray(data)) {
        // Fallback: if response is array, just show what we get
        setUsers(data);
        setTotalUsers(data.length);
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (err) {
      console.error("Fetch error:", err.message);
      setUsers([]);
      setTotalUsers(0);
      alert("❌ โหลดข้อมูลผู้ใช้ไม่สำเร็จ\n\nข้อผิดพลาด: " + err.message + "\n\nกรุณาตรวจสอบ Backend server");
    } finally {
      setLoading(false);
    }
  };

  const changeRole = async (id, newRole) => {
    if (!window.confirm(`⚠️ ยืนยันการเปลี่ยนสิทธิ์เป็น ${newRole.toUpperCase()}?`)) return;

    try {
      const res = await fetch(`${API_URL}/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        alert("✅ เปลี่ยน Role เรียบร้อย");
        fetchUsers();
      } else {
        alert("❌ เปลี่ยน Role ไม่สำเร็จ");
      }
    } catch (err) {
      alert("❌ เปลี่ยน Role ไม่สำเร็จ: " + err.message);
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
          role: editingUser.role || "user"  // ✅ บันทึก role ด้วย
        }),
      });
      if (res.ok) {
        alert("✅ บันทึกข้อมูลเรียบร้อย");
        setEditingUser(null);
        fetchUsers();
      } else {
        alert("❌ บันทึกไม่สำเร็จ");
      }
    } catch (err) {
      alert("❌ บันทึกไม่สำเร็จ: " + err.message);
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
                    {editingUser?.id === user.id ? (
                      <select
                        value={editingUser.role || "user"}
                        onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                        style={{
                          padding: "6px 8px",
                          borderRadius: "6px",
                          border: "1px solid var(--card-border)",
                          background: "var(--bg-secondary)",
                          color: "var(--text-main)",
                          cursor: "pointer"
                        }}
                      >
                        <option value="user">User</option>
                        <option value="store_owner">Store Owner</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span
                        style={{
                          background: user.role === "admin" ? "var(--primary)" : user.role === "store_owner" ? "#f59e0b" : "#2ed573",
                          color: "white",
                          padding: "6px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "bold"
                        }}
                      >
                        {user.role === "admin" ? "👑 ADMIN" : user.role === "store_owner" ? "🏪 STORE OWNER" : "👤 USER"}
                      </span>
                    )}
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
                          onClick={() => changeRole(user.id, user.role === "admin" ? "user" : "admin")}
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

          {/* ✅ Pagination Controls */}
          <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "30px", alignItems: "center" }}>
            <button 
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              style={{ padding: "8px 12px", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.5 : 1 }}
            >
              ← Previous
            </button>
            
            <span style={{ color: "white", fontSize: "14px", fontWeight: "bold" }}>
              Page {page} of {Math.ceil(totalUsers / pageSize)} (Total: {totalUsers} users)
            </span>
            
            <button 
              onClick={() => setPage(page + 1)}
              disabled={page * pageSize >= totalUsers}
              style={{ padding: "8px 12px", cursor: page * pageSize >= totalUsers ? "not-allowed" : "pointer", opacity: page * pageSize >= totalUsers ? 0.5 : 1 }}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;