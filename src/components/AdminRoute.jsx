import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AdminRoute({ children }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ color: "white", padding: "100px", textAlign: "center" }}>
        <h2>Checking Admin Permissions...</h2>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role !== "admin") return <Navigate to="/" replace />;

  return children;
}

export default AdminRoute;