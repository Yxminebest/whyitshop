import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { sanitizeInput } from "../utils/sanitize";

function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]); // 🔥 เพิ่ม

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState(null);

  const [editId, setEditId] = useState(null);

  const [couponCode, setCouponCode] = useState("");
  const [couponType, setCouponType] = useState("percent");
  const [couponValue, setCouponValue] = useState("");

  /* ================= LOAD ================= */

  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchUsers(); // 🔥 เพิ่ม
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*");
    setProducts(data || []);
  };

  const fetchOrders = async () => {
    const { data } = await supabase.from("orders").select("*");
    setOrders(data || []);
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from("users").select("*");
    setUsers(data || []);
  };

  /* ================= ADD / UPDATE PRODUCT ================= */

  const saveProduct = async () => {
    if (!name || !price || !category) {
      alert("กรอกข้อมูลให้ครบ");
      return;
    }

    try {
      const safeName = sanitizeInput(name);
      let imageUrl = null;

      if (image) {
        const safeFileName =
          Date.now() +
          "_" +
          image.name.replace(/[^a-zA-Z0-9.]/g, "_");

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(safeFileName, image);

        if (uploadError) {
          alert("อัปโหลดรูปไม่สำเร็จ");
          return;
        }

        const { data } = supabase.storage
          .from("product-images")
          .getPublicUrl(safeFileName);

        imageUrl = data.publicUrl;
      }

      if (editId) {
        await supabase
          .from("products")
          .update({
            name: safeName,
            price: Number(price),
            category,
            ...(imageUrl && { image: imageUrl }),
          })
          .eq("id", editId);

        alert("แก้ไขสินค้าแล้ว");
        setEditId(null);
      } else {
        if (!imageUrl) {
          alert("กรุณาใส่รูปสินค้า");
          return;
        }

        await supabase.from("products").insert([
          {
            name: safeName,
            price: Number(price),
            category,
            image: imageUrl,
          },
        ]);

        alert("เพิ่มสินค้าแล้ว");
      }

      setName("");
      setPrice("");
      setCategory("");
      setImage(null);

      fetchProducts();
    } catch (err) {
      console.log(err);
    }
  };

  /* ================= EDIT ================= */

  const handleEdit = (item) => {
    setEditId(item.id);
    setName(item.name);
    setPrice(item.price);
    setCategory(item.category);
  };

  /* ================= DELETE ================= */

  const deleteProduct = async (id) => {
    await supabase.from("products").delete().eq("id", id);
    fetchProducts();
  };

  /* ================= ORDER ================= */

  const updateStatus = async (id, status) => {
    await supabase.from("orders").update({ status }).eq("id", id);
    fetchOrders();
  };

  /* ================= USER MANAGEMENT ================= */

  const updateUserRole = async (id, role) => {
    await supabase.from("users").update({ role }).eq("id", id);
    fetchUsers();
  };

  /* ================= COUPON ================= */

  const createCoupon = async () => {
    if (!couponCode || !couponValue) {
      alert("กรอกข้อมูลคูปอง");
      return;
    }

    const { error } = await supabase.from("coupons").insert([
      {
        code: couponCode,
        type: couponType,
        value: Number(couponValue),
        is_active: true,
      },
    ]);

    if (error) {
      alert("สร้างคูปองไม่สำเร็จ");
    } else {
      alert("สร้างคูปองสำเร็จ");
      setCouponCode("");
      setCouponValue("");
    }
  };

  /* ================= UI ================= */

  return (
    <div style={{ padding: "40px", color: "white" }}>
      <h1>🛠 Admin Dashboard</h1>

      {/* PRODUCT */}
      <h2 style={{ marginTop: "40px" }}>🛒 Product</h2>

      <div style={formBox}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อสินค้า" style={input} />
        <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" placeholder="ราคา" style={input} />

        <select value={category} onChange={(e) => setCategory(e.target.value)} style={input}>
          <option value="">หมวดหมู่</option>
          <option>Mouse</option>
          <option>Keyboard</option>
          <option>Monitor</option>
          <option>Headset</option>
        </select>

        <input type="file" onChange={(e) => setImage(e.target.files[0])} style={input} />

        <button onClick={saveProduct} style={addBtn}>
          {editId ? "บันทึก" : "เพิ่มสินค้า"}
        </button>
      </div>

      {products.map((p) => (
        <div key={p.id} style={card}>
          <div>
            <img src={p.image} width={100} />
            <p>{p.name}</p>
            <p>{p.price} บาท</p>
          </div>
          <div>
            <button onClick={() => handleEdit(p)}>แก้ไข</button>
            <button onClick={() => deleteProduct(p.id)} style={deleteBtn}>ลบ</button>
          </div>
        </div>
      ))}

      {/* ORDER */}
      <h2 style={{ marginTop: "60px" }}>📦 Orders</h2>

      {orders.map((o) => (
        <div key={o.id} style={card}>
          <div>
            <p>{o.email}</p>
            <p>{o.total_price} บาท</p>
            <p>{o.status}</p>
          </div>
          <div>
            <button onClick={() => updateStatus(o.id, "shipped")} style={shipBtn}>Ship</button>
            <button onClick={() => updateStatus(o.id, "cancelled")} style={deleteBtn}>Cancel</button>
          </div>
        </div>
      ))}

      {/* USER */}
      <h2 style={{ marginTop: "60px" }}>👤 Users</h2>

      {users.map((u) => (
        <div key={u.id} style={card}>
          <div>
            <p>{u.email}</p>
            <p>{u.role}</p>
          </div>

          <div>
            {u.role === "admin" ? (
              <button onClick={() => updateUserRole(u.id, "user")} style={deleteBtn}>
                ลดเป็น user
              </button>
            ) : (
              <button onClick={() => updateUserRole(u.id, "admin")} style={shipBtn}>
                ตั้งเป็น admin
              </button>
            )}
          </div>
        </div>
      ))}

      {/* COUPON */}
      <h2 style={{ marginTop: "60px" }}>🎟 Coupon</h2>

      <div style={formBox}>
        <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="CODE" style={input} />
        <select value={couponType} onChange={(e) => setCouponType(e.target.value)} style={input}>
          <option value="percent">%</option>
          <option value="fixed">บาท</option>
        </select>
        <input value={couponValue} onChange={(e) => setCouponValue(e.target.value)} type="number" placeholder="ค่า" style={input} />

        <button onClick={createCoupon} style={addBtn}>สร้างคูปอง</button>
      </div>
    </div>
  );
}

/* STYLE */
const formBox = { background: "#020617", padding: "20px", borderRadius: "12px", width: "400px" };
const input = { width: "100%", padding: "10px", marginBottom: "10px" };
const addBtn = { background: "green", color: "white", padding: "10px" };
const deleteBtn = { background: "red", color: "white", padding: "8px" };
const shipBtn = { background: "green", color: "white", padding: "8px" };
const card = { background: "#1e293b", padding: "15px", marginTop: "10px", display: "flex", justifyContent: "space-between" };

export default AdminDashboard;