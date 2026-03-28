import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { logAction } from "../utils/logger";

function Navbar({ theme, toggleTheme }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("user");
  const [cartCount, setCartCount] = useState(0);
  const [adminDropdown, setAdminDropdown] = useState(false);

  useEffect(() => {
    if (authUser?.id) {
      setUser(authUser);
      const fetchUserRole = async () => {
        try {
          const { data } = await supabase
            .from("users")
            .select("role")
            .eq("id", authUser.id)
            .maybeSingle();
          setUserRole(data?.role || "user");
        } catch (err) {
          console.error("Error fetching user role:", err);
          setUserRole("user");
        }
      };
      fetchUserRole();
    } else {
      setUser(null);
      setUserRole("user");
    }
  }, [authUser]);

  useEffect(() => {
    // ✅ อ่านจำนวนสินค้าจาก localStorage ทันทีเมื่อ component mount
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      setCartCount(cart.length);
    };

    // เรียกครั้งแรก
    updateCartCount();
    
    // ฟังการเปลี่ยนแปลง localStorage
    const handleCartUpdate = () => {
      updateCartCount();
    };

    window.addEventListener("cartUpdated", handleCartUpdate);
    
    // ✅ เพิ่ม: ฟังการเปลี่ยนแปลง storage จาก tabs อื่น
    window.addEventListener("storage", handleCartUpdate);
    
    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
      window.removeEventListener("storage", handleCartUpdate);
    };
  }, []);

  const logoutUser = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      logAction("LOGOUT", `User ${user?.email} logged out`);
      localStorage.clear();
      sessionStorage.clear();
      navigate("/login");
      window.location.reload();
    } catch (err) {
      console.error("Logout error:", err);
      alert("❌ Logout failed: " + err.message);
    }
  };

  if (authLoading) {
    return (
      <nav className="navbar" style={{ background: "var(--card-bg)", padding: "20px" }}>
        <div className="nav-container" style={{ textAlign: "center", color: "var(--text-muted)" }}>
          ⏳ Loading...
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar" style={{ 
      position: "relative", 
      width: "100%", 
      zIndex: 1000, 
      background: "var(--card-bg)",
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
      borderBottom: "1px solid var(--card-border)"
    }}>
      
      {/* 🟢 TOP RIGHT: Theme, Profile & Logout Only */}
      <div style={{
        position: "absolute",
        top: "15px",
        right: "20px",
        display: "flex",
        gap: "12px",
        alignItems: "center"
      }}>
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme} 
          style={{
            background: "transparent",
            border: "1px solid var(--card-border)",
            color: "var(--text-main)",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            cursor: "pointer",
            fontSize: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "0.3s"
          }}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>

        {user ? (
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "5px" }}>
                <button onClick={() => navigate("/my-orders")} title="My Orders" style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "18px" }}>📦</button>
                <button onClick={() => navigate("/profile")} title="Settings" style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "18px" }}>⚙️</button>
            </div>
            
            <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-main)" }}>
              👤 {user.email.split('@')[0]}
            </span>

            <button onClick={logoutUser} style={{ 
              background: "rgba(255, 71, 87, 0.1)", 
              color: "#ff4757", 
              padding: "6px 12px", 
              border: "1px solid #ff4757", 
              borderRadius: "20px", 
              cursor: "pointer", 
              fontWeight: "bold", 
              fontSize: "12px",
              transition: "0.3s"
            }}>Logout</button>
          </div>
        ) : (
          <button onClick={() => navigate("/login")} style={{ 
            background: "var(--primary)", 
            color: "white", 
            padding: "8px 20px", 
            border: "none", 
            borderRadius: "20px", 
            cursor: "pointer", 
            fontWeight: "bold" 
          }}>Login</button>
        )}
      </div>

      {/* 🔵 MAIN MENU SECTION: Centered Menu Items + Cart */}
      <div className="nav-container" style={{ 
        display: "flex", 
        justifyContent: "center",
        padding: "15px 0"
      }}>
        <div className="nav-menu" style={{ 
          display: "flex", 
          gap: "8px", 
          alignItems: "center",
          background: "var(--bg-secondary)",
          padding: "6px",
          borderRadius: "30px",
          border: "1px solid var(--card-border)"
        }}>
            <button
              className={`nav-link ${location.pathname === "/" ? "active" : ""}`}
              onClick={() => navigate("/")}
              style={{ 
                background: location.pathname === "/" ? "var(--primary)" : "transparent",
                color: location.pathname === "/" ? "white" : "var(--text-main)",
                padding: "8px 18px", border: "none", borderRadius: "25px", cursor: "pointer", fontWeight: "bold", transition: "0.3s"
              }}
            >
              🏠 Home
            </button>
            <button
              className={`nav-link ${location.pathname === "/products" ? "active" : ""}`}
              onClick={() => navigate("/products")}
              style={{ 
                background: location.pathname === "/products" ? "var(--primary)" : "transparent",
                color: location.pathname === "/products" ? "white" : "var(--text-main)",
                padding: "8px 18px", border: "none", borderRadius: "25px", cursor: "pointer", fontWeight: "bold", transition: "0.3s"
              }}
            >
              🛍️ Products
            </button>
            <button
              className={`nav-link ${location.pathname === "/coupons" ? "active" : ""}`}
              onClick={() => navigate("/coupons")}
              style={{ 
                background: location.pathname === "/coupons" ? "var(--primary)" : "transparent",
                color: location.pathname === "/coupons" ? "white" : "var(--text-main)",
                padding: "8px 18px", border: "none", borderRadius: "25px", cursor: "pointer", fontWeight: "bold", transition: "0.3s"
              }}
            >
              🎟️ Coupons
            </button>

            {/* 🛒 CART BUTTON (Moved here) */}
            <button
              onClick={() => navigate("/cart")}
              style={{ 
                background: location.pathname === "/cart" ? "var(--primary)" : "rgba(0, 212, 255, 0.1)",
                color: location.pathname === "/cart" ? "white" : "#00d4ff",
                padding: "8px 18px", 
                border: "1px solid #00d4ff", 
                borderRadius: "25px", 
                cursor: "pointer", 
                fontWeight: "900",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "0.3s"
              }}
            >
              🛒 <span style={{ fontSize: "14px" }}>Cart ({cartCount})</span>
            </button>

            {/* Admin Menu Section */}
            {user && userRole === "admin" && (
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setAdminDropdown(!adminDropdown)}
                  style={{ 
                    background: adminDropdown ? "#333" : "transparent",
                    color: adminDropdown ? "white" : "var(--text-main)",
                    padding: "8px 18px", border: "none", borderRadius: "25px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: "5px"
                  }}
                >
                  ⚙️ Admin {adminDropdown ? "▲" : "▼"}
                </button>
                {adminDropdown && (
                  <div style={{
                    position: "absolute", top: "110%", left: "50%", transform: "translateX(-50%)", background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "12px", boxShadow: "0 8px 20px rgba(0,0,0,0.2)", minWidth: "180px", zIndex: 100, overflow: "hidden"
                  }}>
                    <button onClick={() => { navigate("/admin/dashboard"); setAdminDropdown(false); }} style={{ width: "100%", padding: "12px", textAlign: "left", background: "transparent", border: "none", color: "var(--text-main)", cursor: "pointer", borderBottom: "1px solid var(--card-border)" }}>📊 Dashboard</button>
                    <button onClick={() => { navigate("/admin/users"); setAdminDropdown(false); }} style={{ width: "100%", padding: "12px", textAlign: "left", background: "transparent", border: "none", color: "var(--text-main)", cursor: "pointer", borderBottom: "1px solid var(--card-border)" }}>👥 Users</button>
                    <button onClick={() => { navigate("/admin/orders"); setAdminDropdown(false); }} style={{ width: "100%", padding: "12px", textAlign: "left", background: "transparent", border: "none", color: "var(--text-main)", cursor: "pointer" }}>📦 Orders</button>
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;