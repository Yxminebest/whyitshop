import { Link, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { CartContext } from "../context/CartContext";
import { supabase } from "../lib/supabase";

function Navbar() {
  const { cartItems } = useContext(CartContext);

  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  const navigate = useNavigate();

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
    // 🔥 โหลด session ครั้งแรก
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        setUser(data.session.user);
        fetchRole(data.session.user.id);
      }
    });

    // 🔥 realtime listener
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
    console.log("CLICK LOGOUT");

    try {
      await supabase.auth.signOut();

      // 🔥 ล้าง session ฝั่ง browser
      localStorage.clear();
      sessionStorage.clear();

      // 🔥 redirect แบบ force (สำคัญมาก)
      window.location.replace("/login");

    } catch (err) {
      console.log("LOGOUT ERROR:", err);
    }
  };

  /* ================= UI ================= */

  return (
    <nav
      style={{
        background: "#020617",
        padding: "15px 40px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        color: "white",
      }}
    >
      <h2>💻 WHY IT Shop</h2>

      <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
        <Link to="/" style={link}>Home</Link>

        <Link to="/products" style={link}>Products</Link>

        <Link to="/cart" style={link}>
          Cart 🛒 ({totalQty})
        </Link>

        {user && (
          <Link to="/profile" style={link}>
            Profile
          </Link>
        )}

        {role === "admin" && (
          <Link to="/admin" style={link}>
            Admin
          </Link>
        )}

        {user ? (
          <>
            <span style={{ fontSize: "14px" }}>
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

const link = {
  color: "white",
  textDecoration: "none",
  fontWeight: "bold",
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