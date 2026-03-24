import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { sanitizeInput } from "../utils/sanitize"; 

function AdminDashboard() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState(null);
  const [description, setDescription] = useState("");
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [couponCode, setCouponCode] = useState("");
  const [couponType, setCouponType] = useState("percent");
  const [couponValue, setCouponValue] = useState("");

  useEffect(() => {
    checkAdmin();
    fetchProducts();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return navigate("/login");

    const { data } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (data?.role !== "admin") {
      alert("ไม่มีสิทธิ์ ❌");
      navigate("/");
    }
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    setProducts(data || []);
  };

  const saveProduct = async () => {
    if (!name || !price || !category || !description) {
      return alert("กรอกข้อมูลให้ครบ");
    }

    try {
      setLoading(true);
      let imageUrl = null;

      if (image) {
        const fileName = `${Date.now()}_${image.name.replace(/\s+/g, "_")}`;
        const { error } = await supabase.storage
          .from("product-images")
          .upload(fileName, image);

        if (error) return alert("❌ อัปโหลดรูปไม่สำเร็จ");

        imageUrl = supabase.storage
          .from("product-images")
          .getPublicUrl(fileName).data.publicUrl;
      }

      if (editId) {
        await supabase.from("products").update({
          name: sanitizeInput(name),
          price: Number(price),
          category,
          description: sanitizeInput(description),
          ...(imageUrl && { image: imageUrl })
        }).eq("id", editId);

        alert("✅ แก้ไขสินค้าแล้ว");
        setEditId(null);

      } else {
        if (!imageUrl) return alert("ต้องใส่รูป");

        await supabase.from("products").insert([{
          name: sanitizeInput(name),
          price: Number(price),
          category,
          image: imageUrl,
          description: sanitizeInput(description)
        }]);

        alert("✅ เพิ่มสินค้าแล้ว");
      }

      resetForm();
      fetchProducts();

    } catch (err) {
      alert("Error saving");
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    if (!confirm("ยืนยันการลบ?")) return;
    await supabase.from("products").delete().eq("id", id);
    fetchProducts();
  };

  const handleEdit = (item) => {
    setEditId(item.id);
    setName(item.name);
    setPrice(item.price);
    setCategory(item.category);
    setDescription(item.description || "");
  };

  const resetForm = () => {
    setName("");
    setPrice("");
    setCategory("");
    setImage(null);
    setDescription("");
  };

  const createCoupon = async () => {
    if (!couponCode || !couponValue) {
      return alert("❌ กรอกข้อมูลให้ครบ");
    }

    await supabase.from("coupons").insert([{
      code: sanitizeInput(couponCode.toUpperCase()),
      type: couponType,
      value: Number(couponValue),
      is_active: true
    }]);

    alert("✅ สร้างคูปองสำเร็จ");
    setCouponCode("");
    setCouponValue("");
  };

  return (
    <div className="page-container">

      {/* 🔥 HEADER + ปุ่ม Logs */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>🛠 Admin Dashboard</h1>

        {/* ✅ ปุ่ม Logs */}
        <button
          onClick={() => navigate("/admin/logs")}
          className="btn-primary"
          style={{ padding: "10px 18px", fontSize: "14px" }}
        >
          📊 ดู Logs
        </button>
      </div>

      {/* ADD PRODUCT */}
      <div className="glass-card">
        <h2>{editId ? "แก้ไขสินค้า" : "เพิ่มสินค้า"}</h2>

        <input
          value={name}
          onChange={(e) => setName(sanitizeInput(e.target.value))}
          placeholder="ชื่อสินค้า"
        />

        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="ราคา"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">เลือกหมวดหมู่</option>
          <option>Mouse</option>
          <option>Keyboard</option>
          <option>Monitor</option>
          <option>Headset</option>
        </select>

        <textarea
          value={description}
          onChange={(e) => setDescription(sanitizeInput(e.target.value))}
          placeholder="รายละเอียดสินค้า"
        />

        <input type="file" onChange={(e) => setImage(e.target.files[0])} />

        <button onClick={saveProduct}>
          {loading ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>

      {/* ADD COUPON */}
      <div className="glass-card">
        <h2>🎟 สร้างคูปอง</h2>

        <input
          value={couponCode}
          onChange={(e) => setCouponCode(sanitizeInput(e.target.value))}
          placeholder="COUPON CODE"
        />

        <select
          value={couponType}
          onChange={(e) => setCouponType(e.target.value)}
        >
          <option value="percent">%</option>
          <option value="fixed">บาท</option>
        </select>

        <input
          type="number"
          value={couponValue}
          onChange={(e) => setCouponValue(e.target.value)}
        />

        <button onClick={createCoupon}>
          สร้างคูปอง
        </button>
      </div>

      {/* PRODUCT LIST */}
      {products.map((p) => (
        <div key={p.id}>
          <h4>{p.name}</h4>
          <button onClick={() => handleEdit(p)}>แก้ไข</button>
          <button onClick={() => deleteProduct(p.id)}>ลบ</button>
        </div>
      ))}

    </div>
  );
}

export default AdminDashboard;