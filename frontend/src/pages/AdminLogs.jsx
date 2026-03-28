import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AdminLogs() {
  const navigate = useNavigate();
  const { user: authUser, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && authUser) {
      checkAdmin();
      fetchLogs();
    }
  }, [authUser, authLoading]);

  // 🔐 ตรวจว่าเป็น admin
  const checkAdmin = async () => {
    if (!authUser?.id) {
      navigate("/login");
      return;
    }

    const { data } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (data?.role !== "admin") {
      alert("❌ ไม่มีสิทธิ์เข้าหน้านี้");
      navigate("/");
    }
  };

  // 📥 โหลด logs
  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setLogs(data || []);
    } catch (err) {
      console.error("Fetch logs error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1 style={{ marginBottom: "30px" }}>📊 System Logs</h1>

      {loading ? (
        <p>Loading...</p>
      ) : logs.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>
          ยังไม่มี log ในระบบ
        </p>
      ) : (
        <div className="glass-card" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                <th style={th}>User ID</th>
                <th style={th}>Action</th>
                <th style={th}>Detail</th>
                <th style={th}>Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <td style={td}>{log.user_id}</td>
                  <td style={td}>{log.action}</td>
                  <td style={td}>{log.detail}</td>
                  <td style={td}>
                    {new Date(log.created_at).toLocaleString()}
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

// 🎨 style
const th = {
  textAlign: "left",
  padding: "12px",
  fontSize: "14px",
  color: "var(--text-muted)"
};

const td = {
  padding: "12px",
  fontSize: "14px"
};

export default AdminLogs;