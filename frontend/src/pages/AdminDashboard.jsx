import { useEffect, useState } from "react";
import { supabase } from "../../Backend/config/supabase";
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
    // เลื่อนหน้าจอขึ้นไปข้างบนเพื่อแก้ข้อมูล
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setName("");
    setPrice("");
    setCategory("");
    setImage(null);
    setDescription("");
    setEditId(null);
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
    <div className="page-container" style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "800" }}>🛠 Admin Dashboard</h1>
        <button
          onClick={() => navigate("/admin/logs")}
          className="btn-primary"
          style={{ padding: "12px 24px", fontSize: "14px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px" }}
        >
          📊 ดู Logs ระบบ
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "30px" }}>
        
        {/* ADD / EDIT PRODUCT */}
        <div className="glass-card" style={{ padding: "30px", textAlign: "left" }}>
          <h2 style={{ marginBottom: "20px", color: "var(--primary)", display: "flex", alignItems: "center", gap: "10px" }}>
            {editId ? "📝 แก้ไขรายละเอียดสินค้า" : "📦 เพิ่มสินค้าใหม่เข้าสต็อก"}
          </h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <input
              className="input-glass"
              value={name}
              onChange={(e) => setName(sanitizeInput(e.target.value))}
              placeholder="ชื่อสินค้า (เช่น LOGA YAKSA 75%)"
            />

            <div style={{ display: "flex", gap: "15px" }}>
              <input
                className="input-glass"
                type="number"
                style={{ flex: 1 }}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="ราคาสินค้า (บาท)"
              />
              <select
                className="input-glass"
                style={{ flex: 1 }}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">เลือกหมวดหมู่</option>
                <option>Mouse</option>
                <option>Keyboard</option>
                <option>Monitor</option>
                <option>Headset</option>
              </select>
            </div>

            <textarea
              className="input-glass"
              style={{ minHeight: "100px", resize: "vertical" }}
              value={description}
              onChange={(e) => setDescription(sanitizeInput(e.target.value))}
              placeholder="ระบุรายละเอียดสินค้าโดยสังเขป..."
            />

            <div style={{ background: "rgba(255,255,255,0.05)", padding: "15px", borderRadius: "12px", border: "1px dashed var(--card-border)" }}>
               <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "10px" }}>รูปภาพสินค้า (JPG/PNG):</p>
               <input type="file" onChange={(e) => setImage(e.target.files[0])} style={{ fontSize: "14px" }} />
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button className="btn-success" onClick={saveProduct} disabled={loading} style={{ flex: 2, padding: "15px" }}>
                {loading ? "กำลังดำเนินการ..." : editId ? "อัปเดตข้อมูลสินค้า" : "ยืนยันการเพิ่มสินค้า"}
              </button>
              {editId && (
                <button className="btn-primary" onClick={resetForm} style={{ flex: 1, background: "var(--bg-secondary)" }}>ยกเลิก</button>
              )}
            </div>
          </div>
        </div>

        {/* ADD COUPON */}
        <div className="glass-card" style={{ padding: "30px", textAlign: "left" }}>
          <h2 style={{ marginBottom: "20px", color: "var(--accent)", display: "flex", alignItems: "center", gap: "10px" }}>
            🎟 สร้างคูปองส่วนลดใหม่
          </h2>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", alignItems: "flex-end" }}>
            <div style={{ flex: 2, minWidth: "200px" }}>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "5px" }}>CODE:</p>
              <input
                className="input-glass"
                value={couponCode}
                onChange={(e) => setCouponCode(sanitizeInput(e.target.value))}
                placeholder="เช่น WHYIT30"
              />
            </div>

            <div style={{ flex: 1, minWidth: "100px" }}>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "5px" }}>ประเภท:</p>
              <select
                className="input-glass"
                value={couponType}
                onChange={(e) => setCouponType(e.target.value)}
              >
                <option value="percent">ลดเป็น %</option>
                <option value="fixed">ลดเป็น บาท</option>
              </select>
            </div>

            <div style={{ flex: 1, minWidth: "100px" }}>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "5px" }}>มูลค่า:</p>
              <input
                className="input-glass"
                type="number"
                value={couponValue}
                onChange={(e) => setCouponValue(e.target.value)}
                placeholder="0"
              />
            </div>

            <button className="btn-primary" onClick={createCoupon} style={{ padding: "15px 30px" }}>
              สร้างคูปอง
            </button>
          </div>
        </div>

        {/* PRODUCT LIST (TABLE STYLE) */}
        <div className="glass-card" style={{ padding: "30px" }}>
          <h2 style={{ marginBottom: "20px", textAlign: "left" }}>📦 รายการสินค้าทั้งหมดในระบบ</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {products.length === 0 ? (
              <p style={{ color: "var(--text-muted)", padding: "20px" }}>ไม่มีสินค้าในระบบ</p>
            ) : (
              products.map((p) => (
                <div key={p.id} style={{ 
                  display: "flex", justifyContent: "space-between", alignItems: "center", 
                  padding: "15px 20px", background: "rgba(255,255,255,0.03)", 
                  borderRadius: "15px", border: "1px solid var(--card-border)" 
                }}>
                  <div style={{ textAlign: "left" }}>
                    <h4 style={{ margin: 0, fontSize: "16px" }}>{p.name}</h4>
                    <p style={{ margin: 0, fontSize: "13px", color: "var(--primary)", fontWeight: "bold" }}>
                      {p.price.toLocaleString()} บาท | <span style={{ color: "var(--text-muted)" }}>{p.category}</span>
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={() => handleEdit(p)} className="btn-primary" style={{ padding: "8px 15px", fontSize: "12px", background: "var(--bg-secondary)" }}>แก้ไข</button>
                    <button onClick={() => deleteProduct(p.id)} className="btn-primary" style={{ padding: "8px 15px", fontSize: "12px", background: "var(--danger)" }}>ลบ</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default AdminDashboard;