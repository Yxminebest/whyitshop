import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

function AdminUsers() {
  const navigate = useNavigate();

  /* ================= STATE ================= */
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ================= INIT ================= */
  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, []);

  /* ================= CHECK ADMIN ================= */
  const checkAdmin = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error || data?.role !== "admin") {
        alert("คุณไม่มีสิทธิ์ ❌");
        navigate("/");
      }
    } catch (err) {
      console.error(err);
      navigate("/");
    }
  };

  /* ================= FETCH USERS ================= */
  const fetchUsers = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("users")
        .select("*");

      console.log("ALL USERS:", data); // 🔥 debug

      if (error) {
        console.error(error);
        alert("โหลด user ไม่สำเร็จ");
      } else {
        setUsers(data || []);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= TOGGLE ROLE ================= */
  const toggleRole = async (id, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin";

    if (!window.confirm(`เปลี่ยนเป็น ${newRole}?`)) return;

    const { error } = await supabase
      .from("users")
      .update({ role: newRole })
      .eq("id", id);

    if (error) {
      alert("❌ เปลี่ยน role ไม่สำเร็จ");
    } else {
      fetchUsers();
    }
  };

  /* ================= DELETE ================= */
  const deleteUser = async (id) => {
    if (!window.confirm("Delete user?")) return;

    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", id);

    if (error) {
      alert("❌ ลบไม่สำเร็จ");
    } else {
      fetchUsers();
    }
  };

  /* ================= SAVE EDIT ================= */
  const saveEdit = async () => {
    if (!editingUser) return;

    const { error } = await supabase
      .from("users")
      .update({
        username: editingUser.username,
        phone: editingUser.phone,
      })
      .eq("id", editingUser.id);

    if (error) {
      alert("❌ บันทึกไม่สำเร็จ");
    } else {
      setEditingUser(null);
      fetchUsers();
    }
  };

  /* ================= UI ================= */
  return (
    <div style={container}>
      <h1 style={title}>👥 Manage Users</h1>

      <div style={card}>
        {loading ? (
          <p>Loading...</p>
        ) : users.length === 0 ? (
          <p>❌ ไม่มี user</p>
        ) : (
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Email</th>
                <th style={th}>Username</th>
                <th style={th}>Phone</th>
                <th style={th}>Role</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td style={td}>{user.email}</td>

                  {/* USERNAME */}
                  <td style={td}>
                    {editingUser?.id === user.id ? (
                      <input
                        value={editingUser?.username || ""}
                        onChange={(e) =>
                          setEditingUser({
                            ...editingUser,
                            username: e.target.value,
                          })
                        }
                        style={input}
                      />
                    ) : (
                      user.username || "-"
                    )}
                  </td>

                  {/* PHONE */}
                  <td style={td}>
                    {editingUser?.id === user.id ? (
                      <input
                        value={editingUser?.phone || ""}
                        onChange={(e) =>
                          setEditingUser({
                            ...editingUser,
                            phone: e.target.value,
                          })
                        }
                        style={input}
                      />
                    ) : (
                      user.phone || "-"
                    )}
                  </td>

                  {/* ROLE */}
                  <td style={td}>
                    <span
                      style={{
                        color:
                          user.role === "admin"
                            ? "#22c55e"
                            : "#94a3b8",
                        fontWeight: "bold",
                      }}
                    >
                      {user.role}
                    </span>
                  </td>

                  {/* ACTIONS */}
                  <td style={td}>
                    {editingUser?.id === user.id ? (
                      <>
                        <button style={btnPrimary} onClick={saveEdit}>
                          Save
                        </button>
                        <button
                          style={btnSecondary}
                          onClick={() => setEditingUser(null)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          style={btnPrimary}
                          onClick={() => setEditingUser(user)}
                        >
                          Edit
                        </button>

                        <button
                          style={btnRole}
                          onClick={() =>
                            toggleRole(user.id, user.role)
                          }
                        >
                          Role
                        </button>

                        <button
                          style={btnDanger}
                          onClick={() => deleteUser(user.id)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ================= STYLE ================= */

const container = {
  padding: "40px",
  background: "#020617",
  minHeight: "100vh",
  color: "white",
};

const title = {
  fontSize: "28px",
  marginBottom: "20px",
};

const card = {
  background: "#111827",
  padding: "20px",
  borderRadius: "12px",
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
};

const th = {
  textAlign: "left",
  padding: "12px",
  borderBottom: "1px solid #374151",
};

const td = {
  padding: "12px",
};

const input = {
  padding: "6px",
  borderRadius: "6px",
  border: "1px solid #374151",
  background: "#020617",
  color: "white",
};

const btnPrimary = {
  background: "#3b82f6",
  color: "white",
  padding: "6px 10px",
  borderRadius: "6px",
  marginRight: "6px",
};

const btnSecondary = {
  background: "#6b7280",
  color: "white",
  padding: "6px 10px",
  borderRadius: "6px",
};

const btnRole = {
  background: "#22c55e",
  color: "white",
  padding: "6px 10px",
  borderRadius: "6px",
  marginLeft: "6px",
};

const btnDanger = {
  background: "#ef4444",
  color: "white",
  padding: "6px 10px",
  borderRadius: "6px",
  marginLeft: "6px",
};

export default AdminUsers;