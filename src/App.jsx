import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";

/* ================= COMPONENTS ================= */
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute"; 

/* ================= PUBLIC PAGES ================= */
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Coupons from "./pages/Coupons";

/* ================= AUTH PAGES ================= */
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

/* ================= USER PAGES ================= */
import Profile from "./pages/Profile";
import MyOrders from "./pages/MyOrders";

/* ================= ADMIN PAGES ================= */
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminOrders from "./pages/AdminOrders";

function App() {
  /* ================= THEME STATE ================= */
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  useEffect(() => {
    // อัปเดต data-theme เพื่อให้ CSS ทำงาน
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <Router>
      {/* ส่งค่า Theme ไปให้ Navbar ใช้งานด้วย */}
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      
      {/* ส่วนแสดงเนื้อหาหลักของหน้าเว็บ */}
      <main className="main-content" style={{ minHeight: '80vh', paddingBottom: '40px' }}>
        <Routes>
          {/* Public Routes - ใครก็เข้าได้ */}
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/coupons" element={<Coupons />} />

          {/* Auth Routes - สำหรับล็อกอิน/สมัครสมาชิก */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* User Routes - ต้องล็อกอินก่อน (ProtectedRoute) */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/my-orders" element={
            <ProtectedRoute>
              <MyOrders />
            </ProtectedRoute>
          } />

          {/* Admin Routes - ต้องเป็น Admin เท่านั้น (AdminRoute) */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          <Route path="/admin/users" element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          } />
          <Route path="/admin/orders" element={
            <AdminRoute>
              <AdminOrders />
            </AdminRoute>
          } />

          {/* 404 Page (Optional) - ถ้าหาหน้าไม่เจอให้กลับไปหน้าแรก */}
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;