import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext"; // 1. Import AuthProvider เข้ามา

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* 2. นำ AuthProvider มาล้อมรอบ CartProvider และ App */}
    <AuthProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </AuthProvider>
  </React.StrictMode>
);