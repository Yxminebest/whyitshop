import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { sanitizeInput } from "../utils/sanitize";

function AdminDashboard() {
  const [products, setProducts] = useState([]);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState(null);

  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  /* COUPON */
  const [couponCode, setCouponCode] = useState("");
  const [couponType, setCouponType] = useState("percent");
  const [couponValue, setCouponValue] = useState("");
  const [couponMsg, setCouponMsg] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase.from("products").select("*");

    if (error) {
      console.log("❌ fetch error:", error);
    } else {
      setProducts(data || []);
    }
  };

  /* ================= SAVE PRODUCT ================= */
  const saveProduct = async () => {
    if (!name || !price || !category) {
      alert("กรอกข้อมูลให้ครบ");
      return;
    }

    try {
      setLoading(true);

      const safeName = sanitizeInput(name);
      let imageUrl = null;

      /* ===== UPLOAD ===== */
      if (image) {
        const cleanName = image.name
          .replace(/\s+/g, "_")
          .replace(/[^a-zA-Z0-9._-]/g, "");

        const fileName = Date.now() + "_" + cleanName;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(fileName, image, {
            contentType: image.type, // 🔥 FIX สำคัญ
          });

        if (uploadError) {
          console.log("UPLOAD ERROR:", uploadError);
          alert("❌ อัปโหลดรูปไม่สำเร็จ");
          setLoading(false);
          return;
        }

        const { data } = supabase.storage
          .from("product-images")
          .getPublicUrl(fileName);

        imageUrl = data.publicUrl;
      }

      /* ===== UPDATE ===== */
      if (editId) {
        const { error } = await supabase
          .from("products")
          .update({
            name: safeName,
            price: Number(price),
            category,
            ...(imageUrl && { image: imageUrl }),
          })
          .eq("id", editId);

        if (error) {
          console.log(error);
          alert("❌ แก้ไขไม่สำเร็จ");
        } else {
          alert("✅ แก้ไขสินค้าแล้ว");
        }

        setEditId(null);
      }

      /* ===== INSERT ===== */
      else {
        if (!imageUrl) {
          alert("ต้องใส่รูป");
          setLoading(false);
          return;
        }

        const { error } = await supabase.from("products").insert([
          {
            name: safeName,
            price: Number(price),
            category,
            image: imageUrl,
          },
        ]);

        if (error) {
          console.log(error);
          alert("❌ เพิ่มสินค้าไม่สำเร็จ");
        } else {
          alert("✅ เพิ่มสินค้าแล้ว");
        }
      }

      /* RESET */
      setName("");
      setPrice("");
      setCategory("");
      setImage(null);

      await fetchProducts();
    } catch (err) {
      console.log("ERROR:", err);
    }

    setLoading(false);
  };

  /* ================= DELETE ================= */
  const deleteProduct = async (id) => {
    if (!confirm("ยืนยันการลบ?")) return;

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      alert("ลบไม่สำเร็จ");
    } else {
      fetchProducts();
    }
  };

  /* ================= EDIT ================= */
  const handleEdit = (item) => {
    setEditId(item.id);
    setName(item.name);
    setPrice(item.price);
    setCategory(item.category);
  };

  /* ================= CREATE COUPON ================= */
  const createCoupon = async () => {
    if (!couponCode || !couponValue) {
      setCouponMsg("❌ กรอกข้อมูลให้ครบ");
      return;
    }

    try {
      const { error } = await supabase.from("coupons").insert([
        {
          code: couponCode.toUpperCase(),
          type: couponType,
          value: Number(couponValue),
          is_active: true,
        },
      ]);

      if (error) {
        console.log(error);
        setCouponMsg("❌ สร้างไม่สำเร็จ");
      } else {
        setCouponMsg("✅ สร้างคูปองสำเร็จ");
        setCouponCode("");
        setCouponValue("");
      }
    } catch (err) {
      console.log(err);
    }
  };

  /* ================= UI ================= */

  return (
    <div style={container}>
      <h1 style={{ marginBottom: 20 }}>🛠 Admin Dashboard</h1>

      <div style={grid}>
        {/* PRODUCT */}
        <div style={card}>
          <h2>📦 เพิ่มสินค้า</h2>

          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อสินค้า" style={input}/>
          <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" placeholder="ราคา" style={input}/>

          <select value={category} onChange={(e) => setCategory(e.target.value)} style={input}>
            <option value="">หมวดหมู่</option>
            <option>Mouse</option>
            <option>Keyboard</option>
            <option>Monitor</option>
            <option>Headset</option>
          </select>

          <input type="file" onChange={(e) => setImage(e.target.files[0])} style={input}/>

          <button onClick={saveProduct} style={btnGreen} disabled={loading}>
            {loading ? "กำลังบันทึก..." : editId ? "บันทึก" : "เพิ่มสินค้า"}
          </button>
        </div>

        {/* COUPON */}
        <div style={card}>
          <h2>🎟 สร้างคูปอง</h2>

          <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="CODE เช่น WHY50" style={input}/>

          <select value={couponType} onChange={(e) => setCouponType(e.target.value)} style={input}>
            <option value="percent">เปอร์เซ็น</option>
            <option value="fixed">บาท</option>
          </select>

          <input type="number" value={couponValue} onChange={(e) => setCouponValue(e.target.value)} placeholder="Value" style={input}/>

          <button onClick={createCoupon} style={btnBlue}>
            สร้างคูปอง
          </button>

          {couponMsg && <p style={{ marginTop: 10 }}>{couponMsg}</p>}
        </div>
      </div>

      {/* PRODUCT LIST */}
      <h2 style={{ marginTop: 40 }}>สินค้า</h2>

      {products.length === 0 ? (
        <p>ไม่มีสินค้า</p>
      ) : (
        products.map((p) => (
          <div key={p.id} style={productCard}>
            <img
              src={p.image}
              width={100}
              onError={(e) =>
                (e.target.src = "https://via.placeholder.com/100")
              }
            />

            <div>
              <p>{p.name}</p>
              <p>{p.price} บาท</p>
            </div>

            <div>
              <button onClick={() => handleEdit(p)}>แก้ไข</button>
              <button onClick={() => deleteProduct(p.id)} style={btnRed}>
                ลบ
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* STYLE */

const container = {
  padding: "40px",
  color: "white",
  background: "#020617",
  minHeight: "100vh",
};

const grid = {
  display: "flex",
  gap: "30px",
  flexWrap: "wrap",
};

const card = {
  background: "#0f172a",
  padding: "20px",
  borderRadius: "12px",
  width: "300px",
};

const input = {
  width: "100%",
  padding: "10px",
  marginBottom: "10px",
  borderRadius: "6px",
};

const productCard = {
  background: "#1e293b",
  padding: "15px",
  marginTop: "10px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderRadius: "10px",
};

const btnGreen = {
  background: "#22c55e",
  color: "white",
  padding: "10px",
  width: "100%",
  borderRadius: "6px",
  border: "none",
};

const btnBlue = {
  background: "#2563eb",
  color: "white",
  padding: "10px",
  width: "100%",
  borderRadius: "6px",
  border: "none",
};

const btnRed = {
  background: "red",
  color: "white",
  padding: "6px",
  border: "none",
};

export default AdminDashboard;