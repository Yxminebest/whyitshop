import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // ดึงข้อมูลจาก Context มาใช้

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth(); // ใช้ค่า loading และ user จาก AuthContext

  // ถ้า Context ยังโหลดข้อมูลจาก Supabase ไม่เสร็จ ให้โชว์ข้อความนี้
  if (loading) {
    return (
      <div style={{ color: "white", padding: "100px", textAlign: "center" }}>
        <h2>Verifying Identity...</h2>
        <p>Please wait a moment.</p>
      </div>
    );
  }

  // ถ้าโหลดเสร็จแล้วแต่ไม่มี User (ไม่ได้ Login) ให้ดีดไปหน้า Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ถ้า Login แล้ว ให้แสดงเนื้อหาข้างใน (เช่นหน้า Profile)
  return children;
}

export default ProtectedRoute;