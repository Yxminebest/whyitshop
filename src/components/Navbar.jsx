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
      <h2 style={{ fontWeight: 800, letterSpacing: "-1px" }}>
        <span style={{ color: "var(--primary)" }}>WHY IT</span> Shop
      </h2>

      <div className="nav-links">
        {/* Toggle Theme Button */}
        <button className="theme-toggle" onClick={toggleTheme} title="Switch Theme">
          {theme === "light" ? "🌙" : "☀️"}
        </button>

        <Link to="/" className="nav-link">Home</Link>
        <Link to="/products" className="nav-link">Products</Link>
        <Link to="/coupons" className="nav-link">Coupons</Link>
        <Link to="/cart" className="nav-link">🛒 ({totalQty})</Link>

        {user && (
          <>
            <Link to="/profile" className="nav-link">Profile</Link>
            <Link to="/my-orders" className="nav-link">Orders</Link>
          </>
        )}

        {role === "admin" && (
          <>
            <Link to="/admin" className="nav-link" style={{ color: "var(--accent)" }}>Dashboard</Link>
          </>
        )}

        {user ? (
          <button onClick={logoutUser} className="btn-primary" style={{ background: "var(--danger)" }}>
            Logout
          </button>
        ) : (
          <Link to="/login" className="btn-primary">Login</Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;