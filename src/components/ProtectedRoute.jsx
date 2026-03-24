import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        setUser(user);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  if (loading) {
    return (
      <p style={{ color: "white", padding: "40px" }}>
        Checking login...
      </p>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;