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
    <nav className="navbar" style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '10px 20px', 
      background: 'var(--bg-nav)', 
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      {/* ฝั่งซ้าย: Logo และ Link ทั่วไป */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
        <h2 style={{ fontWeight: 800, margin: 0, cursor: 'pointer', fontSize: '1.5rem' }} onClick={() => navigate('/')}>
          <span style={{ color: "var(--primary)" }}>WHY IT</span> Shop
        </h2>
        
        <div className="nav-links" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/products" className="nav-link">Products</Link>
          <Link to="/coupons" className="nav-link">Coupons</Link>
          
          {/* เมนูพิเศษสำหรับ Admin (ฝั่งซ้าย) */}
          {role === "admin" && (
            <div style={{ display: 'flex', gap: '15px', marginLeft: '10px', paddingLeft: '15px', borderLeft: '1px solid var(--card-border)' }}>
              <Link to="/admin" className="nav-link" style={{ color: "var(--accent)", fontWeight: '600' }}>Dashboard</Link>
              <Link to="/admin/users" className="nav-link" style={{ color: "var(--accent)", fontWeight: '600' }}>Users</Link>
              <Link to="/admin/orders" className="nav-link" style={{ color: "var(--accent)", fontWeight: '600' }}>Orders</Link>
            </div>
          )}
        </div>
      </div>

      {/* ฝั่งขวา: Theme, Cart, Profile, Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
        <button className="theme-toggle" onClick={toggleTheme} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: '5px' }}>
          {theme === "light" ? "🌙" : "☀️"}
        </button>

        <Link to="/cart" className="nav-link" style={{ position: 'relative', fontSize: '1.1rem' }}>
          🛒 <span style={{ 
            position: 'absolute',
            top: '-8px',
            right: '-10px',
            background: 'var(--primary)', 
            color: 'white', 
            borderRadius: '50%', 
            padding: '2px 6px', 
            fontSize: '10px',
            fontWeight: 'bold'
          }}>{totalQty}</span>
        </Link>

        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <div style={{ height: '24px', width: '2px', background: 'var(--card-border)' }}></div>
            
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', fontWeight: '700' }}>
                👋 {user.user_metadata?.full_name || user.email?.split('@')[0]}
              </div>
              {role === 'admin' && (
                <small style={{ color: 'var(--accent)', display: 'block', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }}>
                  Admin Mode
                </small>
              )}
            </div>

            <div className="user-menu" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Link to="/profile" className="nav-link">Profile</Link>
              <button 
                onClick={handleLogout} 
                className="btn-primary" 
                style={{ 
                  background: "var(--danger)", 
                  border: 'none', 
                  borderRadius: '8px', 
                  padding: "8px 16px", 
                  cursor: 'pointer', 
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <Link to="/login" className="btn-primary" style={{ padding: "8px 20px", borderRadius: '8px', textDecoration: 'none', fontWeight: '600' }}>
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;