import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AdminRoute({ children }) {
  const { user, role, loading } = useAuth();

  if (loading) return <p style={{ color: "white", padding: "40px" }}>Loading Permissions...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (role !== "admin") return <Navigate to="/" replace />;

  return children;
}
export default AdminRoute;