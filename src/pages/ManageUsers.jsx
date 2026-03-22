import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

function ManageUsers() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ================= CHECK ADMIN ================= */
  useEffect(() => {
    checkAdmin();
    fetchUsers();
  }, []);

  const checkAdmin = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/login");
      return;
    }

    const { data } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (data?.role !== "admin") {
      alert("คุณไม่มีสิทธิ์เข้า ❌");
      navigate("/");
    }
  };

  /* ================= FETCH USERS ================= */
  const fetchUsers = async () => {
    const { data, error } = await supabase.from("users").select("*");

    if (error) {
      console.error(error);
    } else {
      setUsers(data);
    }

    setLoading(false);
  };

  /* ================= CHANGE ROLE ================= */
  const toggleRole = async (id, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin";

    const confirmChange = confirm(
      `เปลี่ยน role เป็น ${newRole} ?`
    );

    if (!confirmChange) return;

    const { error } = await supabase
      .from("users")
      .update({ role: newRole })
      .eq("id", id);

    if (error) {
      alert("❌ เปลี่ยนไม่สำเร็จ");
    } else {
      alert(`✅ เปลี่ยนเป็น ${newRole}`);
      fetchUsers();
    }
  };

  /* ================= UI ================= */
  return (
    <div style={container}>
      <h1>👥 Manage Users</h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div style={table}>
          <div style={header}>
            <span>Email</span>
            <span>Role</span>
            <span>Action</span>
          </div>

          {users.map((u) => (
            <div key={u.id} style={row}>
              <span>{u.email}</span>

              <span
                style={{
                  color: u.role === "admin" ? "#22c55e" : "#94a3b8",
                }}
              >
                {u.role}
              </span>

              <button
                onClick={() => toggleRole(u.id, u.role)}
                style={btn}
              >
                เปลี่ยนเป็น {u.role === "admin" ? "user" : "admin"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================= STYLE ================= */

const container = {
  padding: "40px",
  color: "white",
  background: "#020617",
  minHeight: "100vh",
};

const table = {
  marginTop: "20px",
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  padding: "10px",
  fontWeight: "bold",
  borderBottom: "1px solid gray",
};

const row = {
  display: "flex",
  justifyContent: "space-between",
  padding: "10px",
  borderBottom: "1px solid #1e293b",
};

const btn = {
  background: "#2563eb",
  color: "white",
  padding: "5px 10px",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};

export default ManageUsers;