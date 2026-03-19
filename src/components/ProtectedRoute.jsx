import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      try {
        // 🔐 1. เช็ค login
        const { data } = await supabase.auth.getUser();

        if (!data?.user) {
          navigate("/login");
          return;
        }

        // 🔐 2. เช็ค role จาก DB
        const { data: userData, error } = await supabase
          .from("users")
          .select("role")
          .eq("id", data.user.id)
          .single();

        if (error || userData?.role !== "admin") {
          navigate("/"); // ไม่ใช่ admin → กลับหน้า home
          return;
        }

        // ✅ ผ่าน → แสดงหน้าได้
        setLoading(false);

      } catch (err) {
        console.error(err);
        navigate("/login");
      }
    };

    checkUser();
  }, [navigate]);

  // ⏳ ระหว่างโหลด
  if (loading) {
    return (
      <p style={{ color: "white", padding: "40px" }}>
        Checking permission...
      </p>
    );
  }

  // ✅ ผ่านแล้ว
  return children;
}

export default ProtectedRoute;