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

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) fetchRole(currentUser.id);
      else setRole(null);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const logoutUser = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      
      {/* ================= ฝั่งซ้าย: เมนูทั่วไป ================= */}
      <div className="nav-left">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/products" className="nav-link">Products</Link>
        <Link to="/coupons" className="nav-link">Coupons</Link>
      </div>

      {/* ================= ตรงกลาง: โลโก้ ================= */}
      <div className="nav-center">
        <Link to="/" style={{ textDecoration: "none" }}>
          <h2 className="brand-logo">
            <span style={{ color: "var(--primary)" }}>WHY IT</span>
            <span style={{ color: "var(--text-main)", marginLeft: "6px" }}>Shop</span>
          </h2>
        </Link>
      </div>

      {/* ================= ฝั่งขวา: เมนูแอดมิน / ตะกร้า / ระบบสมาชิก ================= */}
      <div className="nav-right">
        
        {/* เมนูสำหรับ Admin */}
        {role === "admin" && (
          <div className="admin-menu-group">
            <Link to="/admin" className="nav-link admin-link">Dashboard</Link>
            <Link to="/admin/users" className="nav-link admin-link">Users</Link>
            <Link to="/admin/orders" className="nav-link admin-link">Manage Orders</Link>
          </div>
        )}

        {/* เมนูสำหรับลูกค้าธรรมดา */}
        {user && role !== "admin" && (
           <Link to="/my-orders" className="nav-link">My Orders</Link>
        )}

        {/* ตะกร้าสินค้า */}
        <Link to="/cart" className="nav-link cart-badge">
          🛒 Cart <span className="cart-count">{totalQty}</span>
        </Link>

        {/* ปุ่มสลับโหมด */}
        <button className="theme-toggle" onClick={toggleTheme} title="Switch Theme">
          {theme === "light" ? "🌙" : "☀️"}
        </button>

        {/* โปรไฟล์ และ ปุ่ม Login/Logout */}
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