import { useLocation, useNavigate } from "react-router-dom";

function Breadcrumb() {
  const location = useLocation();
  const navigate = useNavigate();

  // แมปเส้นทางไปชื่อหน้า
  const pathMap = {
    "/": "🏠 Home",
    "/products": "🛍️ Products",
    "/coupons": "🎟️ Coupons",
    "/cart": "🛒 Cart",
    "/my-orders": "📦 My Orders",
    "/profile": "⚙️ Profile",
    "/admin/dashboard": "📊 Admin Dashboard",
    "/admin/users": "👥 Manage Users",
    "/admin/orders": "📦 Manage Orders",
    "/admin/logs": "📋 Action Logs",
    "/login": "🔐 Login",
    "/register": "✍️ Register",
    "/forgot-password": "🔑 Forgot Password",
    "/reset-password": "🔄 Reset Password",
  };

  const currentPath = location.pathname;
  const pageName = pathMap[currentPath] || "📄 Page";

  return (
    <div style={{
      background: "var(--bg-secondary)",
      padding: "10px 20px",
      borderBottom: "1px solid var(--card-border)",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      fontSize: "13px",
      color: "var(--text-muted)",
      fontWeight: "500",
      letterSpacing: "0.4px",
    }}>
      <button
        onClick={() => navigate("/")}
        style={{
          background: "transparent",
          border: "none",
          color: "var(--primary)",
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: "bold",
          padding: "4px 8px",
          transition: "0.3s",
        }}
        onMouseEnter={(e) => e.target.style.transform = "scale(1.1)"}
        onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
        title="Go to Home"
      >
        🏠
      </button>

      <span style={{ color: "var(--card-border)" }}>/</span>

      <span style={{ 
        fontWeight: "600", 
        color: "var(--text-main)",
        fontSize: "13px",
      }}>
        {pageName}
      </span>
    </div>
  );
}

export default Breadcrumb;
