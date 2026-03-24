import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

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

    // 1. เช็ค Session ครั้งแรกที่เปิดเว็บ
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (isMounted) {
        const currentUser = session?.user || null;
        setUser(currentUser);
        if (currentUser) await fetchRole(currentUser.id);
        setLoading(false);
      }
    };

    initAuth();

    // 2. ดักฟังการ Login / Logout
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user || null;
      if (isMounted) {
        setUser(currentUser);
        if (currentUser) {
          await fetchRole(currentUser.id);
        } else {
          setRole(null);
        }
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);