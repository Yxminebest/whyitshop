import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { CartContext } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

function Navbar({ theme, toggleTheme }) {
  const { cartItems } = useContext(CartContext);
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const totalQty = cartItems.reduce((sum, item) => sum + (item.qty || 1), 0);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="navbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', background: 'var(--bg-nav)', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <h2 style={{ fontWeight: 800, margin: 0, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <span style={{ color: "var(--primary)" }}>WHY IT</span> Shop
        </h2>
        
        <div className="nav-links" style={{ display: 'flex', gap: '15px' }}>
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/products" className="nav-link">Products</Link>
          <Link to="/coupons" className="nav-link">Coupons</Link>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <button className="theme-toggle" onClick={toggleTheme} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>
          {theme === "light" ? "🌙" : "☀️"}
        </button>

        <Link to="/cart" className="nav-link" style={{ position: 'relative' }}>
          🛒 <span style={{ background: 'var(--primary)', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '12px' }}>{totalQty}</span>
        </Link>

        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <div style={{ height: '24px', width: '2px', background: 'var(--card-border)' }}></div>
            
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>👋 {user.user_metadata?.full_name || 'User'}</div>
              {role === 'admin' && <small style={{ color: 'var(--accent)', display: 'block', fontSize: '10px' }}>ADMIN PANEL</small>}
            </div>

            <div className="user-menu" style={{ display: 'flex', gap: '10px' }}>
              <Link to="/profile" className="nav-link">Profile</Link>
              {role === "admin" && (
                <Link to="/admin" className="nav-link" style={{ color: "var(--accent)", fontWeight: 'bold' }}>Admin</Link>
              )}
              <button onClick={handleLogout} className="btn-primary" style={{ background: "var(--danger)", border: 'none', borderRadius: '8px', padding: "8px 15px", cursor: 'pointer', color: 'white' }}>
                Logout
              </button>
            </div>
          </div>
        ) : (
          <Link to="/login" className="btn-primary" style={{ padding: "8px 20px", borderRadius: '8px', textDecoration: 'none' }}>Login</Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;