import { Link, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { CartContext } from "../context/CartContext";
import { supabase } from "../../Backend/config/supabase";

function Navbar({ theme, toggleTheme }) {
  const { cartItems } = useContext(CartContext);
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  const totalQty = cartItems.reduce((sum, item) => sum + (item.qty || 1), 0);

  // ฟังก์ชันดึง Role จากฐานข้อมูล
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

    // 🔥 ปรับปรุง Listener ให้ดักจับการ Logout ได้แม่นยำขึ้น
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setUser(null);
        setRole(null);
        localStorage.clear();
        sessionStorage.clear();
      } else if (session?.user) {
        setUser(session.user);
        fetchRole(session.user.id);
      }
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // 🔥 ฟังก์ชัน Logout แบบล้างกระดาน (Hard Reset)
  const logoutUser = async () => {
    try {
      // 1. ล้างค่าใน state ก่อนเพื่อความไว
      setUser(null);
      setRole(null);
      
      // 2. สั่ง signOut จากระบบหลังบ้าน
      await supabase.auth.signOut();
      
      // 3. ล้างขยะใน Browser ทั้งหมด
      localStorage.clear();
      sessionStorage.clear();
      
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      // 4. 🚀 บังคับรีโหลดหน้าเว็บไปที่ Login (แก้ปัญหาค้าง Loading ได้ขาดกระจุย)
      window.location.href = "/login"; 
    }
  };

  return (
    <nav className="navbar">
      {/* --- ฝั่งซ้าย --- */}
      <div className="nav-left">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/products" className="nav-link">Products</Link>
        <Link to="/coupons" className="nav-link">Coupons</Link>
      </div>

      {/* --- ตรงกลาง (Logo) --- */}
      <div className="nav-center">
        <Link to="/" style={{ textDecoration: "none" }}>
          <h2 className="brand-logo">
            <span style={{ color: "var(--primary)" }}>WHY IT</span>
            <span style={{ color: "var(--text-main)", marginLeft: "6px" }}>Shop</span>
          </h2>
        </Link>
      </div>

      {/* --- ฝั่งขวา --- */}
      <div className="nav-right">
        {/* เมนูแอดมิน */}
        {role === "admin" && (
          <div className="admin-menu-group">
            <Link to="/admin" className="nav-link admin-link">Dashboard</Link>
            <Link to="/admin/users" className="nav-link admin-link">Users</Link>
            <Link to="/admin/orders" className="nav-link admin-link">Orders</Link>
          </div>
        )}

        {/* ประวัติการสั่งซื้อ (เฉพาะ User ทั่วไป) */}
        {user && role !== "admin" && (
           <Link to="/my-orders" className="nav-link">My Orders</Link>
        )}

        {/* ตะกร้า */}
        <Link to="/cart" className="nav-link cart-badge">
          🛒 Cart <span className="cart-count">{totalQty}</span>
        </Link>

        {/* ปุ่มสลับโหมดมืด/สว่าง */}
        <button className="theme-toggle" onClick={toggleTheme} title="Switch Theme">
          {theme === "light" ? "🌙" : "☀️"}
        </button>

        {/* โปรไฟล์ และ ปุ่ม Login/Logout */}
        {user ? (
          <div className="user-profile-group">
            <Link to="/profile" className="user-profile-link" title="จัดการโปรไฟล์">
              <span style={{ fontSize: "16px" }}>👋</span>
              <span className="user-name-text">
                {user.user_metadata?.username || user.user_metadata?.full_name || user.email.split("@")[0]}
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