import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);

  const fetchUsers = async () => {
    const { data } = await supabase.from("users").select("*");
    setUsers(data || []);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleRole = async (id, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    await supabase.from("users").update({ role: newRole }).eq("id", id);
    fetchUsers();
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    await supabase.from("users").delete().eq("id", id);
    fetchUsers();
  };

  const saveEdit = async () => {
    await supabase
      .from("users")
      .update({
        username: editingUser.username,
        phone: editingUser.phone,
      })
      .eq("id", editingUser.id);

    setEditingUser(null);
    fetchUsers();
  };

  return (
    <div style={container}>
      <h1 style={title}>👥 Manage Users</h1>

      <div style={card}>
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

                <td style={td}>
                  {editingUser?.id === user.id ? (
                    <input
                      value={editingUser.username || ""}
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

                <td style={td}>
                  {editingUser?.id === user.id ? (
                    <input
                      value={editingUser.phone || ""}
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

                <td style={td}>{user.role}</td>

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
                        onClick={() => toggleRole(user.id, user.role)}
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
      </div>
    </div>
  );
}

/* ================= STYLE ================= */

const container = { padding: "40px" };

const title = { fontSize: "28px", marginBottom: "20px" };

const card = {
  background: "#111827",
  padding: "20px",
  borderRadius: "12px",
};

const table = { width: "100%", borderCollapse: "collapse" };

const th = {
  textAlign: "left",
  padding: "12px",
  borderBottom: "1px solid #374151",
};

const td = { padding: "12px" };

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
  border: "none",
  padding: "6px 10px",
  borderRadius: "6px",
  marginRight: "6px",
};

const btnSecondary = {
  background: "#6b7280",
  color: "white",
  border: "none",
  padding: "6px 10px",
  borderRadius: "6px",
};

const btnRole = {
  background: "#22c55e",
  color: "white",
  border: "none",
  padding: "6px 10px",
  borderRadius: "6px",
  marginLeft: "6px",
};

const btnDanger = {
  background: "#ef4444",
  color: "white",
  border: "none",
  padding: "6px 10px",
  borderRadius: "6px",
  marginLeft: "6px",
};

export default AdminUsers;