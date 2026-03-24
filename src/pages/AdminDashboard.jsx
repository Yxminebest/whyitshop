import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

const sanitizeInput = (text) => text?.replace(/[<>]/g, "").replace(/script/gi, "") || "";

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
    const { data } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (data?.role !== "admin") { alert("ไม่มีสิทธิ์ ❌"); navigate("/"); }
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts(data || []);
  };

  const saveProduct = async () => {
    if (!name || !price || !category || !description) return alert("กรอกข้อมูลให้ครบ");
    try {
      setLoading(true);
      let imageUrl = null;

      if (image) {
        const fileName = `${Date.now()}_${image.name.replace(/\s+/g, "_")}`;
        const { error } = await supabase.storage.from("product-images").upload(fileName, image);
        if (error) return alert("❌ อัปโหลดรูปไม่สำเร็จ");
        imageUrl = supabase.storage.from("product-images").getPublicUrl(fileName).data.publicUrl;
      }

      if (editId) {
        await supabase.from("products").update({ name: sanitizeInput(name), price: Number(price), category, description, ...(imageUrl && { image: imageUrl }) }).eq("id", editId);
        alert("✅ แก้ไขสินค้าแล้ว");
        setEditId(null);
      } else {
        if (!imageUrl) return alert("ต้องใส่รูป");
        await supabase.from("products").insert([{ name: sanitizeInput(name), price: Number(price), category, image: imageUrl, description }]);
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
    setEditId(item.id); setName(item.name); setPrice(item.price); setCategory(item.category); setDescription(item.description || "");
  };

  const resetForm = () => { setName(""); setPrice(""); setCategory(""); setImage(null); setDescription(""); };

  const createCoupon = async () => {
    if (!couponCode || !couponValue) return alert("❌ กรอกข้อมูลให้ครบ");
    await supabase.from("coupons").insert([{ code: couponCode.toUpperCase(), type: couponType, value: Number(couponValue), is_active: true }]);
    alert("✅ สร้างคูปองสำเร็จ");
    setCouponCode(""); setCouponValue("");
  };

  return (
    <div className="page-container">
      <h1 style={{ marginBottom: "30px" }}>🛠 Admin Dashboard</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "30px", marginBottom: "40px" }}>
        
        {/* ADD PRODUCT */}
        <div className="glass-card">
          <h2 style={{ marginBottom: "20px", color: "var(--primary)" }}>📦 {editId ? "แก้ไขสินค้า" : "เพิ่มสินค้า"}</h2>
          <input className="input-glass" value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อสินค้า" />
          <input className="input-glass" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="ราคา" />
          <select className="input-glass" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">เลือกหมวดหมู่...</option>
            <option>Mouse</option>
            <option>Keyboard</option>
            <option>Monitor</option>
            <option>Headset</option>
          </select>
          <textarea className="input-glass" style={{ height: "100px", resize: "none" }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="รายละเอียดสินค้า" />
          <input className="input-glass" style={{ padding: "8px" }} type="file" onChange={(e) => setImage(e.target.files[0])} />
          
          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <button className="btn-success" onClick={saveProduct} style={{ flex: 1 }}>{loading ? "กำลังบันทึก..." : editId ? "อัปเดตข้อมูล" : "เพิ่มสินค้าลงคลัง"}</button>
            {editId && <button className="btn-primary" onClick={() => { resetForm(); setEditId(null); }} style={{ background: "var(--bg-secondary)", color: "var(--text-main)" }}>ยกเลิก</button>}
          </div>
        </div>

        {/* ADD COUPON */}
        <div className="glass-card" style={{ alignSelf: "start" }}>
          <h2 style={{ marginBottom: "20px", color: "var(--accent)" }}>🎟 สร้างคูปองส่วนลด</h2>
          <input className="input-glass" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="COUPON CODE (เช่น NEW100)" />
          <select className="input-glass" value={couponType} onChange={(e) => setCouponType(e.target.value)}>
            <option value="percent">ลดแบบเปอร์เซ็น (%)</option>
            <option value="fixed">ลดแบบราคาเต็ม (บาท)</option>
          </select>
          <input className="input-glass" type="number" value={couponValue} onChange={(e) => setCouponValue(e.target.value)} placeholder="มูลค่าส่วนลด" />
          <button className="btn-primary" onClick={createCoupon} style={{ width: "100%", marginTop: "10px" }}>สร้างคูปอง</button>
        </div>
      </div>

      <h2 style={{ marginBottom: "20px", borderBottom: "1px solid var(--card-border)", paddingBottom: "10px" }}>📋 คลังสินค้าทั้งหมด ({products.length})</h2>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        {products.map((p) => (
          <div key={p.id} className="glass-card" style={{ display: "flex", alignItems: "center", padding: "15px 25px" }}>
            <img src={p.image} style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "10px" }} alt="product" />
            <div style={{ flex: 1, marginLeft: "25px" }}>
              <h4 style={{ fontSize: "16px", marginBottom: "5px" }}>{p.name}</h4>
              <span style={{ background: "var(--bg-secondary)", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", border: "1px solid var(--card-border)", marginRight: "10px" }}>{p.category}</span>
              <span style={{ color: "var(--primary)", fontWeight: "bold" }}>{p.price} บาท</span>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button className="btn-primary" onClick={() => handleEdit(p)} style={{ padding: "8px 15px", fontSize: "14px" }}>แก้ไข</button>
              <button className="btn-primary" onClick={() => deleteProduct(p.id)} style={{ padding: "8px 15px", fontSize: "14px", background: "var(--danger)" }}>ลบ</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminDashboard;