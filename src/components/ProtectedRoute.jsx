import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      try {
        // 🔐 ดึง user จาก session
        const { data } = await supabase.auth.getUser();

        if (!data?.user) {
          navigate("/login");
          return;
        }

        // 🔐 เช็ค role จาก database
        const { data: userData, error } = await supabase
          .from("users")
          .select("role")
          .eq("id", data.user.id)
          .single();

        if (error || userData?.role !== "admin") {
          navigate("/");
          return;
        }

        // ✅ ผ่านทุกเงื่อนไข
        setLoading(false);

      } catch (err) {
        console.log(err);
        navigate("/login");
      }
    };

    checkUser();
  }, [navigate]);

  if (loading) {
    return (
      <p style={{ color: "white", padding: "40px" }}>
        Checking permission...
      </p>
    );
  }

  return children;
}

export default ProtectedRoute;