import { Link, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { CartContext } from "../context/CartContext";
import { supabase } from "../lib/supabase";

function Navbar({ theme, toggleTheme }) {
  const { cartItems } = useContext(CartContext);
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  const totalQty = cartItems.reduce((sum, item) => sum + (item.qty || 1), 0);

  const fetchRole = async (userId) => {
    try {
      const { data } = await supabase.from("users").select("role").eq("id", userId).maybeSingle();
      setRole(data?.role || "user");
    } catch (err) {
      setRole("user");
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      
      const currentUser = data?.session?.user || null;
      setUser(currentUser);
      if (currentUser) fetchRole(currentUser.id);
    };

    loadSession();

    // ฟังการเปลี่ยนแปลงสถานะการล็อกอิน
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      
      const currentUser = session?.user || null;
      setUser(currentUser);
      
      if (currentUser) {
        fetchRole(currentUser.id);
      } else {
        setRole(null);
        // ถ้ามีการ Signed Out ให้เคลียร์ค่าที่อาจค้างในเครื่อง
        if (event === 'SIGNED_OUT') {
           localStorage.clear();
           sessionStorage.clear();
        }
      }
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // 🔥 แก้ไขฟังก์ชัน Logout ให้ดุดันขึ้นเพื่อแก้ปัญหาอาการค้าง
  const logoutUser = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      // 1. ล้างข้อมูลถาวรใน Browser
      localStorage.clear();
      sessionStorage.clear();
      
      // 2. บังคับย้ายหน้าไป Login และรีเฟรชระบบใหม่ทั้งหมด (Hard Reset)
      // วิธีนี้จะช่วยแก้ปัญหาค้างหน้า Loading ได้ดีที่สุดบน Vercel
      window.location.href = "/login"; 
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/products" className="nav-link">Products</Link>
        <Link to="/coupons" className="nav-link">Coupons</Link>
      </div>

      <div className="nav-center">
        <Link to="/" style={{ textDecoration: "none" }}>
          <h2 className="brand-logo">
            <span style={{ color: "var(--primary)" }}>WHY IT</span>
            <span style={{ color: "var(--text-main)", marginLeft: "6px" }}>Shop</span>
          </h2>
        </Link>
      </div>

      <div className="nav-right">
        {role === "admin" && (
          <div className="admin-menu-group">
            <Link to="/admin" className="nav-link admin-link">Dashboard</Link>
            <Link to="/admin/users" className="nav-link admin-link">Users</Link>
            <Link to="/admin/orders" className="nav-link admin-link">Manage Orders</Link>
          </div>
        )}

        {user && role !== "admin" && (
           <Link to="/my-orders" className="nav-link">My Orders</Link>
        )}

        <Link to="/cart" className="nav-link cart-badge">
          🛒 Cart <span className="cart-count">{totalQty}</span>
        </Link>

        <button className="theme-toggle" onClick={toggleTheme} title="Switch Theme">
          {theme === "light" ? "🌙" : "☀️"}
        </button>

        {user ? (
          <div className="user-profile-group">
            <Link to="/profile" className="user-profile-link" title="Profile">
              <span style={{ fontSize: "16px" }}>👋</span>
              <span className="user-name-text">
                {user.user_metadata?.full_name || user.email.split("@")[0]}
              </span>
            </Link>
            <button onClick={logoutUser} className="btn-logout">Logout</button>
          </div>
        ) : (
          <Link to="/login" className="btn-primary" style={{ padding: "8px 20px" }}>Login</Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;