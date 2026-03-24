import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Navigate } from "react-router-dom";

function AdminRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const checkAdmin = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!isMounted) return;

        if (!user) {
          setUser(null);
          setIsAdmin(false);
          return;
        }

        setUser(user);

        const { data, error } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Role error:", error);
          setIsAdmin(false);
          return;
        }

        setIsAdmin(data?.role === "admin");
      } catch (err) {
        console.error("Admin check error:", err);
        setIsAdmin(false);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    checkAdmin();

    return () => {
      isMounted = false;
    };
  }, []);

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <p style={{ color: "white", padding: "40px" }}>
        Checking admin permission...
      </p>
    );
  }

  /* ================= NOT LOGIN ================= */
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  /* ================= NOT ADMIN ================= */
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  /* ================= OK ================= */
  return children;
}

export default AdminRoute;