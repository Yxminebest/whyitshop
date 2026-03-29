import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { sanitizeInput } from "../utils/sanitize";
import { formatPrice, removeComma } from "../utils/formatPrice";
import { uploadImage } from "../utils/uploadImage";

function StoreOwnerDashboard() {
  const navigate = useNavigate();
  const { user: authUser, loading: authLoading } = useAuth();

  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState(""); // ✅ เพิ่ม stock
  const [category, setCategory] = useState("");
  const [image, setImage] = useState(null);
  const [description, setDescription] = useState("");
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCoupons: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0
  });

  useEffect(() => {
    if (!authLoading && authUser) {
      checkStoreOwner();
      fetchProducts();
      fetchStats();
    }
  }, [authUser, authLoading]);

  const checkStoreOwner = async () => {
    if (!authUser?.id) {
      navigate("/login");
      return;
    }

    try {
      const { data } = await supabase.from("users").select("role").eq("id", authUser.id).maybeSingle();
      if (!data || (data.role !== "store_owner" && data.role !== "admin")) {
        alert("❌ คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
        navigate("/");
      }
    } catch (err) {
      console.error("Store owner check error:", err);
      navigate("/");
    }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("store_owner_id", authUser.id)
        .order("created_at", { ascending: false });

      setProducts(data || []);
    } catch (err) {
      console.error("Fetch products error:", err);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: myProducts } = await supabase
        .from("products")
        .select("id")
        .eq("store_owner_id", authUser.id);

      const { data: coupons } = await supabase
        .from("coupons")
        .select("id")
        .eq("store_owner_id", authUser.id);

      const productIds = myProducts?.map(p => p.id) || [];

      // ดึงออเดอร์จริง
      let totalOrders = 0;
      let pendingOrders = 0;
      let completedOrders = 0;

      if (productIds.length > 0) {
        const { data: allOrders } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });

        const { data: allOrderItems } = await supabase
          .from("order_items")
          .select("*");

        // Join orders + order_items
        const ordersWithItems = allOrders?.map((order) => ({
          ...order,
          order_items: allOrderItems?.filter((item) => item.order_id === order.id) || []
        })) || [];

        const filteredOrders = ordersWithItems.filter((order) => {
          const hasMyProducts = order.order_items?.some((item) => 
            productIds.includes(item.product_id)
          );
          return hasMyProducts;
        });

        totalOrders = filteredOrders.length;
        pendingOrders = filteredOrders.filter(o => o.status === "pending").length;
        completedOrders = filteredOrders.filter(o => o.status === "completed").length;
      }

      setStats({
        totalProducts: myProducts?.length || 0,
        totalCoupons: coupons?.length || 0,
        totalOrders,
        pendingOrders,
        completedOrders
      });
    } catch (err) {
      console.error("Fetch stats error:", err);
    }
  };

  const saveProduct = async () => {
    if (!name || !price || !category || !description || !stock) {
      return alert("❌ กรอกข้อมูลให้ครบ (รวม stock)");
    }

    try {
      setLoading(true);
      let imageUrl = null;

      if (image) {
        try {
          imageUrl = await uploadImage(image);
        } catch (err) {
          setLoading(false);
          return alert(`❌ ${err.message}`);
        }
      }

      if (editId) {
        await supabase.from("products").update({
          name: sanitizeInput(name),
          price: Number(removeComma(price)),
          stock: Number(stock), // ✅ Update stock
          category,
          description: sanitizeInput(description),
          ...(imageUrl && { image: imageUrl })
        }).eq("id", editId);

        alert("✅ แก้ไขสินค้าแล้ว");
        setEditId(null);
      } else {
        if (!imageUrl) return alert("❌ ต้องใส่รูป");

        await supabase.from("products").insert([{
          name: sanitizeInput(name),
          price: Number(removeComma(price)),
          stock: Number(stock), // ✅ Save stock
          category,
          description: sanitizeInput(description),
          image: imageUrl,
          store_owner_id: authUser.id
        }]);

        alert("✅ เพิ่มสินค้าแล้ว");
      }

      resetForm();
      fetchProducts();
      fetchStats();

    } catch (err) {
      alert("❌ Error saving product");
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    if (!confirm("❓ ยืนยันการลบสินค้านี้?")) return;
    try {
      await supabase.from("products").delete().eq("id", id);
      fetchProducts();
      fetchStats();
    } catch (err) {
      alert("❌ ลบสินค้าไม่สำเร็จ");
    }
  };

  const handleEdit = (item) => {
    setEditId(item.id);
    setName(item.name);
    setPrice(item.price);
    setStock(item.stock || ""); // ✅ Load stock
    setCategory(item.category);
    setDescription(item.description || "");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setName("");
    setPrice("");
    setStock(""); // ✅ Reset stock
    setCategory("");
    setImage(null);
    setDescription("");
    setEditId(null);
  };

  return (
    <div className="page-container" style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", flexWrap: "wrap", gap: "15px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "800" }}>🏪 Store Owner Dashboard</h1>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={() => navigate("/store/orders")}
            className="btn-primary"
            style={{ padding: "12px 24px", fontSize: "14px", borderRadius: "10px" }}
          >
            📦 ดูออเดอร์
          </button>
          <button
            onClick={() => navigate("/store/coupons")}
            className="btn-primary"
            style={{ padding: "12px 24px", fontSize: "14px", borderRadius: "10px" }}
          >
            🎫 จัดการคูปอง
          </button>
        </div>
      </div>

      {/* STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "15px", marginBottom: "40px" }}>
        <div className="glass-card" style={{ padding: "20px", textAlign: "center" }}>
          <p style={{ fontSize: "24px", fontWeight: "bold", color: "var(--primary)", marginBottom: "5px" }}>{stats.totalProducts}</p>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>📦 สินค้า</p>
        </div>
        <div className="glass-card" style={{ padding: "20px", textAlign: "center" }}>
          <p style={{ fontSize: "24px", fontWeight: "bold", color: "var(--accent)", marginBottom: "5px" }}>{stats.totalOrders}</p>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>📋 ออเดอร์ทั้งหมด</p>
        </div>
        <div className="glass-card" style={{ padding: "20px", textAlign: "center" }}>
          <p style={{ fontSize: "24px", fontWeight: "bold", color: "#facc15", marginBottom: "5px" }}>{stats.pendingOrders}</p>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>⏳ รอการยืนยัน</p>
        </div>
        <div className="glass-card" style={{ padding: "20px", textAlign: "center" }}>
          <p style={{ fontSize: "24px", fontWeight: "bold", color: "#22c55e", marginBottom: "5px" }}>{stats.completedOrders}</p>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>✅ สำเร็จ</p>
        </div>
      </div>

      {/* FORM */}
      <div className="glass-card" style={{ padding: "30px", marginBottom: "40px" }}>
        <h2 style={{ marginBottom: "20px", color: "var(--primary)" }}>
          {editId ? "📝 แก้ไขสินค้า" : "📦 เพิ่มสินค้าใหม่"}
        </h2>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <input
            className="input-glass"
            value={name}
            onChange={(e) => setName(sanitizeInput(e.target.value))}
            placeholder="ชื่อสินค้า"
          />

          <div style={{ display: "flex", gap: "15px" }}>
            <input
              className="input-glass"
              type="text"
              style={{ flex: 1 }}
              value={price}
              onChange={(e) => setPrice(formatPrice(e.target.value))}
              placeholder="ราคา (บาท)"
            />
            <input
              className="input-glass"
              type="number"
              style={{ flex: 1 }}
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="จำนวน Stock"
            />
            <select
              className="input-glass"
              style={{ flex: 1 }}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">เลือกหมวดหมู่</option>
              <option>CPU</option>
              <option>Mainboard</option>
              <option>GPU</option>
              <option>RAM</option>
              <option>Storage</option>
              <option>Keyboard</option>
              <option>Headset</option>
              <option>Mouse</option>
              <option>Monitor</option>
            </select>
          </div>

          <textarea
            className="input-glass"
            style={{ minHeight: "100px" }}
            value={description}
            onChange={(e) => setDescription(sanitizeInput(e.target.value))}
            placeholder="รายละเอียดสินค้า"
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
            className="input-glass"
          />

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={saveProduct}
              className="btn-success"
              style={{ flex: 1, padding: "12px" }}
              disabled={loading}
            >
              {loading ? "⏳ กำลังบันทึก..." : editId ? "💾 อัปเดตสินค้า" : "➕ เพิ่มสินค้า"}
            </button>
            {editId && (
              <button
                onClick={resetForm}
                className="btn-primary"
                style={{ flex: 1, padding: "12px", background: "transparent", color: "var(--text-main)", border: "1px solid var(--card-border)" }}
              >
                ❌ ยกเลิก
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PRODUCTS LIST */}
      <div>
        <h2 style={{ marginBottom: "20px", fontSize: "20px", fontWeight: "bold" }}>📦 สินค้าของฉัน ({products.length})</h2>
        
        {products.length === 0 ? (
          <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px 0" }}>ยังไม่มีสินค้า</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
            {products.map((product) => (
              <div key={product.id} className="glass-card" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <img 
                  src={product.image || "https://via.placeholder.com/200"} 
                  alt={product.name} 
                  style={{ width: "100%", height: "200px", objectFit: "cover" }}
                />
                <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "8px" }}>{product.name}</h3>
                    <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "10px" }}>{product.category}</p>
                    <p style={{ color: "var(--primary)", fontWeight: "bold", fontSize: "16px" }}>{product.price} บาท</p>
                    <p style={{ color: product.stock > 0 ? "#22c55e" : "#ef4444", fontSize: "14px", fontWeight: "bold" }}>
                      📦 Stock: {product.stock || 0}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginTop: "15px" }}>
                    <button
                      onClick={() => handleEdit(product)}
                      className="btn-primary"
                      style={{ flex: 1, padding: "8px", fontSize: "13px", background: "transparent", color: "var(--primary)", border: "1px solid var(--primary)" }}
                    >
                      ✏️ แก้ไข
                    </button>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="btn-primary"
                      style={{ flex: 1, padding: "8px", fontSize: "13px", background: "var(--danger)20", color: "var(--danger)", border: "1px solid var(--danger)" }}
                    >
                      🗑️ ลบ
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default StoreOwnerDashboard;
