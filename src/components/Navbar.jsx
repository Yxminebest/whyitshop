import { Link, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { CartContext } from "../context/CartContext";
import { supabase } from "../lib/supabase";

function Navbar() {
  const { cartItems } = useContext(CartContext);
  const navigate = useNavigate();

  /* ================= STATE ================= */
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  /* ================= CART ================= */
  const totalQty = cartItems.reduce(
    (sum, item) => sum + (item.qty || 1),
    0
  );

  /* ================= FETCH ROLE ================= */
  const fetchRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Role fetch error:", error);
        setRole("user");
        return;
      }

      setRole(data?.role || "user");
    } catch (err) {
      console.error("Fetch role error:", err);
      setRole("user");
    }
  };

  /* ================= AUTH ================= */
  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (!isMounted) return;

      const currentUser = data?.session?.user || null;

      setUser(currentUser);

      if (currentUser) {
        fetchRole(currentUser.id);
      }
    };

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const currentUser = session?.user || null;

        setUser(currentUser);

        if (currentUser) {
          fetchRole(currentUser.id);
        } else {
          setRole(null);
        }
      }
    );

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  /* ================= LOGOUT ================= */
  const logoutUser = async () => {
    try {
      await supabase.auth.signOut();

      localStorage.clear();
      sessionStorage.clear();

      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  /* ================= UI ================= */
  return (
    <nav style={nav}>
      <h2 style={logo}>💻 WHY IT Shop</h2>

      <div style={menu}>
        {/* PUBLIC */}
        <Link to="/" style={link}>Home</Link>
        <Link to="/products" style={link}>Products</Link>
        <Link to="/coupons" style={link}>Coupons</Link>

        {/* CART */}
        <Link to="/cart" style={link}>
          Cart 🛒 ({totalQty})
        </Link>

        {/* USER */}
        {user && (
          <>
            <Link to="/profile" style={link}>Profile</Link>
            <Link to="/my-orders" style={link}>My Orders</Link>
          </>
        )}

        {/* ADMIN */}
        {role === "admin" && (
          <>
            <Link to="/admin" style={link}>Dashboard</Link>
            <Link to="/admin/users" style={link}>Users</Link>
            <Link to="/admin/orders" style={link}>Orders</Link>
          </>
        )}

        {/* AUTH */}
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
          <Link to="/login" style={link}>Login</Link>
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

const logo = {
  fontWeight: "bold",
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
};

export default Navbar;