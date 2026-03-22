import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "./lib/supabase";

/* ================= COMPONENTS ================= */
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

/* ================= PAGES ================= */
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Coupons from "./pages/Coupons";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import Profile from "./pages/Profile";

import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";

function App() {
  /* ================= SYNC USER (สำคัญมาก) ================= */
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          const user = session.user;

          // 🔥 เช็คว่ามีใน table users หรือยัง
          const { data } = await supabase
            .from("users")
            .select("id")
            .eq("id", user.id)
            .maybeSingle();

          // 🔥 ถ้ายังไม่มี → insert
          if (!data) {
            await supabase.from("users").insert([
              {
                id: user.id,
                email: user.email,
                role: "user",
              },
            ]);
          }
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  /* ================= UI ================= */
  return (
    <Router>
      <Navbar />

      <div
        style={{
          background: "#0B1120",
          minHeight: "100vh",
          color: "white",
        }}
      >
        <Routes>
          {/* ================= PUBLIC ================= */}
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/coupons" element={<Coupons />} />

          {/* ================= AUTH ================= */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* ================= USER ================= */}
          <Route path="/profile" element={<Profile />} />

          {/* ================= ADMIN ================= */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;