import { Link } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { CartContext } from "../context/CartContext";
import { supabase } from "../lib/supabase";

function Navbar() {
  const { cartItems } = useContext(CartContext);

  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  /* ================= CART COUNT ================= */

  const totalQty = cartItems.reduce(
    (sum, item) => sum + (item.qty || 1),
    0
  );

  /* ================= FETCH ROLE ================= */

  const fetchRole = async (userId) => {
    const { data } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    setRole(data?.role || "user");
  };

  /* ================= AUTH ================= */

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        setUser(data.session.user);
        fetchRole(data.session.user.id);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          fetchRole(session.user.id);
        } else {
          setUser(null);
          setRole(null);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  /* ================= LOGOUT ================= */

  const logoutUser = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace("/login");
  };

  /* ================= UI ================= */

  return (
    <nav style={nav}>
      <h2 style={{ fontWeight: "bold" }}>💻 WHY IT Shop</h2>

      <div style={menu}>
        <Link to="/" style={link}>Home</Link>
        <Link to="/products" style={link}>Products</Link>

        {/* 🔥 เพิ่ม Coupons ตรงนี้ */}
        <Link to="/coupons" style={link}>Coupons</Link>

        <Link to="/cart" style={link}>
          Cart 🛒 ({totalQty})
        </Link>

        {user && (
          <Link to="/profile" style={link}>
            Profile
          </Link>
        )}

        {/* 🔐 ADMIN */}
        {role === "admin" && (
          <>
            <Link to="/admin" style={link}>
              Admin
            </Link>
            <Link to="/admin/users" style={link}>
              Manage Users
            </Link>
          </>
        )}

        {/* USER INFO */}
        {user ? (
          <>
            <span style={userText}>
              {user.user_metadata?.full_name || user.email}
            </span>

            <button onClick={logoutUser} style={logoutBtn}>
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" style={link}>
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}

/* ================= STYLE ================= */

const nav = {
  background: "#020617",
  padding: "15px 40px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  color: "white",
  boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
};

const menu = {
  display: "flex",
  gap: "20px",
  alignItems: "center",
};

const link = {
  color: "white",
  textDecoration: "none",
  fontWeight: "bold",
  transition: "0.2s",
};

const userText = {
  fontSize: "13px",
  opacity: 0.7,
};

const logoutBtn = {
  background: "#ef4444",
  color: "white",
  border: "none",
  padding: "6px 12px",
  borderRadius: "6px",
  cursor: "pointer",
  transition: "0.2s",
};

export default Navbar;