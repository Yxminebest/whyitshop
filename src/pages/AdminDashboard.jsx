import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // 1. นำเข้า useAuth

const sanitizeInput = (text) => text?.replace(/[<>]/g, "").replace(/script/gi, "") || "";

function AdminDashboard() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth(); // 2. ดึงสถานะจาก Context

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
    // ถ้าเช็คจาก Context แล้วไม่ใช่ Admin ให้ดีดออกทันที
    if (!authLoading && (!user || role !== "admin")) {
      navigate("/");
    } else if (!authLoading && role === "admin") {
      fetchProducts();
    }
  }, [authLoading, role, navigate]);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    setProducts(data || []);
  };

  const saveProduct = async () => {
    if (!name || !price || !category || !description) return alert("❌ กรอกข้อมูลให้ครบ");
    
    try {
      setLoading(true);
      let imageUrl = null;

      // 1. จัดการรูปภาพ (ถ้ามีการเลือกรูปใหม่)
      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("product-images").upload(fileName, image);
        
        if (uploadError) throw new Error("อัปโหลดรูปไม่สำเร็จ");
        
        imageUrl = supabase.storage.from("product-images").getPublicUrl(fileName).data.publicUrl;
      }

      const productData = {
        name: sanitizeInput(name),
        price: Number(price),
        category,
        description: sanitizeInput(description),
        ...(imageUrl && { image: imageUrl })
      };

      // 2. บันทึกหรือแก้ไข
      if (editId) {
        const { error } = await supabase.from("products").update(productData).eq("id", editId);
        if (error) throw error;
        alert("✅ แก้ไขสินค้าเรียบร้อย");
        setEditId(null);
      } else {
        if (!imageUrl) return alert("⚠️ ต้องอัปโหลดรูปภาพสินค้าด้วย");
        const { error } = await supabase.from("products").insert([productData]);
        if (error) throw error;
        alert("✅ เพิ่มสินค้าลงคลังแล้ว");
      }

      resetForm();
      fetchProducts();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("🗑️ คุณแน่ใจหรือไม่ว่าต้องการลบสินค้านี้?")) return;
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      fetchProducts();
    } catch (err) {
      alert("ลบไม่สำเร็จ: " + err.message);
    }
  };

  const handleEdit = (item) => {
    setEditId(item.id);
    setName(item.name);
    setPrice(item.price);
    setCategory(item.category);
    setDescription(item.description || "");
    // เลื่อนหน้าจอขึ้นไปที่ฟอร์มแก้ไข
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setName(""); setPrice(""); setCategory(""); setImage(null); setDescription("");
  };

  const createCoupon = async () => {
    if (!couponCode || !couponValue) return alert("❌ กรอกข้อมูลให้ครบ");
    try {
      const { error } = await supabase.from("coupons").insert([{ 
        code: couponCode.toUpperCase().trim(), 
        type: couponType, 
        value: Number(couponValue), 
        is_active: true 
      }]);
      if (error) throw error;
      alert("✅ สร้างคูปองสำเร็จ");
      setCouponCode(""); setCouponValue("");
    } catch (err) {
      alert("สร้างคูปองไม่สำเร็จ (รหัสอาจซ้ำ): " + err.message);
    }
  };

  if (authLoading) return <div style={{ color: "white", padding: "100px", textAlign: "center" }}>กำลังตรวจสอบสิทธิ์แอดมิน...</div>;

  return (
    <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ marginBottom: "30px", fontWeight: "800", fontSize: '2.5rem' }}>🛠 Admin Dashboard</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "30px", marginBottom: "50px" }}>
        
        {/* ADD / EDIT PRODUCT */}
        <div className="glass-card" style={{ padding: '30px', border: '1px solid var(--card-border)' }}>
          <h2 style={{ marginBottom: "25px", color: "var(--primary)", display: 'flex', alignItems: 'center', gap: '10px' }}>
            {editId ? "📝 แก้ไขสินค้า" : "➕ เพิ่มสินค้าใหม่"}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input className="input-glass" value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อสินค้า" />
            <input className="input-glass" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="ราคาสินค้า (บาท)" />
            <select className="input-glass" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">เลือกหมวดหมู่...</option>
              <option value="Mouse">Mouse</option>
              <option value="Keyboard">Keyboard</option>
              <option value="Monitor">Monitor</option>
              <option value="Headset">Headset</option>
            </select>
            <textarea className="input-glass" style={{ height: "120px", resize: "none", paddingTop: '10px' }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="รายละเอียดสินค้า (บรรยายสรรพคุณ...)" />
            <div style={{ border: '1px dashed var(--card-border)', padding: '15px', borderRadius: '10px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>อัปโหลดรูปภาพสินค้า (แนะนำ 800x600 px)</p>
              <input type="file" onChange={(e) => setImage(e.target.files[0])} style={{ fontSize: '12px' }} />
            </div>
            
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button className="btn-success" onClick={saveProduct} style={{ flex: 1, padding: '12px' }} disabled={loading}>
                {loading ? "⌛ กำลังบันทึก..." : editId ? "💾 บันทึกการแก้ไข" : "🚀 เพิ่มสินค้าลงคลัง"}
              </button>
              {editId && (
                <button className="btn-primary" onClick={() => { resetForm(); setEditId(null); }} style={{ background: "rgba(255,255,255,0.1)", color: "var(--text-main)" }}>
                  ยกเลิก
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ADD COUPON */}
        <div className="glass-card" style={{ alignSelf: "start", padding: '30px', border: '1px solid var(--card-border)' }}>
          <h2 style={{ marginBottom: "25px", color: "var(--accent)" }}>🎟️ สร้างคูปองส่วนลด</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input className="input-glass" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="เช่น NEWSHOP100" />
            <select className="input-glass" value={couponType} onChange={(e) => setCouponType(e.target.value)}>
              <option value="percent">ลดแบบเปอร์เซ็น (%)</option>
              <option value="fixed">ลดแบบราคาเต็ม (บาท)</option>
            </select>
            <input className="input-glass" type="number" value={couponValue} onChange={(e) => setCouponValue(e.target.value)} placeholder="มูลค่าที่ต้องการลด" />
            <button className="btn-primary" onClick={createCoupon} style={{ width: "100%", marginTop: "10px", padding: '12px', fontWeight: 'bold' }}>
              ✨ สร้างคูปอง
            </button>
          </div>
        </div>
      </div>

      <h2 style={{ marginBottom: "25px", display: 'flex', alignItems: 'center', gap: '15px' }}>
        📋 คลังสินค้าทั้งหมด <span style={{ fontSize: '14px', background: 'var(--primary)', padding: '4px 12px', borderRadius: '20px', color: 'white' }}>{products.length} รายการ</span>
      </h2>
      
      <div style={{ display: "grid", gap: "15px" }}>
        {products.map((p) => (
          <div key={p.id} className="glass-card" style={{ display: "flex", alignItems: "center", padding: "15px 25px", border: '1px solid var(--card-border)' }}>
            <img src={p.image} style={{ width: "70px", height: "70px", objectFit: "cover", borderRadius: "10px", border: '1px solid var(--card-border)' }} alt="product" />
            <div style={{ flex: 1, marginLeft: "25px" }}>
              <h4 style={{ fontSize: "16px", marginBottom: "5px", fontWeight: '700' }}>{p.name}</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ background: "var(--bg-secondary)", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", border: "1px solid var(--card-border)" }}>{p.category}</span>
                <span style={{ color: "var(--primary)", fontWeight: "800", fontSize: '15px' }}>{Number(p.price).toLocaleString()} ฿</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button className="btn-primary" onClick={() => handleEdit(p)} style={{ padding: "8px 20px", fontSize: "13px", borderRadius: '8px' }}>แก้ไข</button>
              <button className="btn-primary" onClick={() => deleteProduct(p.id)} style={{ padding: "8px 20px", fontSize: "13px", background: "var(--danger)", borderRadius: '8px' }}>ลบ</button>
            </div>
          </div>
        ))}
        {products.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>ไม่มีสินค้าในคลัง</p>}
      </div>
    </div>
  );
}

export default AdminDashboard;