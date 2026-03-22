import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { sanitizeInput } from "../utils/sanitize";
import { useNavigate } from "react-router-dom";

function AdminDashboard() {
  const navigate = useNavigate();

  /* ================= STATE ================= */
  const [products, setProducts] = useState([]);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState(null);
  const [description, setDescription] = useState("");

  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  /* COUPON */
  const [couponCode, setCouponCode] = useState("");
  const [couponType, setCouponType] = useState("percent");
  const [couponValue, setCouponValue] = useState("");
  const [couponMsg, setCouponMsg] = useState("");

  /* ================= CHECK ADMIN ================= */
  useEffect(() => {
    checkAdmin();
    fetchProducts();
  }, []);

  const checkAdmin = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/login");
      return;
    }

    const { data } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (data?.role !== "admin") {
      alert("คุณไม่มีสิทธิ์เข้า Admin ❌");
      navigate("/");
    }
  };

  /* ================= FETCH ================= */
  const fetchProducts = async () => {
    const { data, error } = await supabase.from("products").select("*");

    if (error) {
      console.error("Fetch error:", error);
    } else {
      setProducts(data || []);
    }
  };

  /* ================= SAVE PRODUCT ================= */
  const saveProduct = async () => {
    if (!name || !price || !category || !description) {
      alert("กรอกข้อมูลให้ครบ");
      return;
    }

    try {
      setLoading(true);

      const safeName = sanitizeInput(name);
      let imageUrl = null;

      /* UPLOAD IMAGE */
      if (image) {
        const cleanName = image.name
          .replace(/\s+/g, "_")
          .replace(/[^a-zA-Z0-9._-]/g, "");

        const fileName = Date.now() + "_" + cleanName;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(fileName, image, {
            contentType: image.type,
          });

        if (uploadError) {
          alert("❌ อัปโหลดรูปไม่สำเร็จ");
          return;
        }

        const { data } = supabase.storage
          .from("product-images")
          .getPublicUrl(fileName);

        imageUrl = data.publicUrl;
      }

      /* UPDATE */
      if (editId) {
        await supabase
          .from("products")
          .update({
            name: safeName,
            price: Number(price),
            category,
            description,
            ...(imageUrl && { image: imageUrl }),
          })
          .eq("id", editId);

        alert("✅ แก้ไขสินค้าแล้ว");
        setEditId(null);
      }

      /* INSERT */
      else {
        if (!imageUrl) {
          alert("ต้องใส่รูป");
          return;
        }

        await supabase.from("products").insert([
          {
            name: safeName,
            price: Number(price),
            category,
            image: imageUrl,
            description,
          },
        ]);

        alert("✅ เพิ่มสินค้าแล้ว");
      }

      resetForm();
      fetchProducts();
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE ================= */
  const deleteProduct = async (id) => {
    if (!confirm("ยืนยันการลบ?")) return;

    await supabase.from("products").delete().eq("id", id);
    fetchProducts();
  };

  /* ================= EDIT ================= */
  const handleEdit = (item) => {
    setEditId(item.id);
    setName(item.name);
    setPrice(item.price);
    setCategory(item.category);
    setDescription(item.description || "");
  };

  /* ================= RESET ================= */
  const resetForm = () => {
    setName("");
    setPrice("");
    setCategory("");
    setImage(null);
    setDescription("");
  };

  /* ================= COUPON ================= */
  const createCoupon = async () => {
    if (!couponCode || !couponValue) {
      setCouponMsg("❌ กรอกข้อมูลให้ครบ");
      return;
    }

    const { error } = await supabase.from("coupons").insert([
      {
        code: couponCode.toUpperCase(),
        type: couponType,
        value: Number(couponValue),
        is_active: true,
      },
    ]);

    if (error) {
      setCouponMsg("❌ สร้างไม่สำเร็จ");
    } else {
      setCouponMsg("✅ สร้างคูปองสำเร็จ");
      setCouponCode("");
      setCouponValue("");
    }
  };

  /* ================= UI ================= */
  return (
    <div style={container}>
      <h1>🛠 Admin Dashboard</h1>

      <div style={grid}>
        {/* PRODUCT */}
        <div style={card}>
          <h2>📦 เพิ่มสินค้า</h2>

          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อสินค้า" style={input} />
          <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" placeholder="ราคา" style={input} />

          <select value={category} onChange={(e) => setCategory(e.target.value)} style={input}>
            <option value="">หมวดหมู่</option>
            <option>Mouse</option>
            <option>Keyboard</option>
            <option>Monitor</option>
            <option>Headset</option>
          </select>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="รายละเอียดสินค้า"
            style={{ ...input, height: "100px" }}
          />

          <input type="file" onChange={(e) => setImage(e.target.files[0])} style={input} />

          <button onClick={saveProduct} style={btnGreen}>
            {loading ? "กำลังบันทึก..." : editId ? "บันทึก" : "เพิ่มสินค้า"}
          </button>
        </div>

        {/* COUPON */}
        <div style={card}>
          <h2>🎟 คูปอง</h2>

          <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="CODE" style={input} />

          <select value={couponType} onChange={(e) => setCouponType(e.target.value)} style={input}>
            <option value="percent">เปอร์เซ็น</option>
            <option value="fixed">บาท</option>
          </select>

          <input type="number" value={couponValue} onChange={(e) => setCouponValue(e.target.value)} placeholder="Value" style={input} />

          <button onClick={createCoupon} style={btnBlue}>สร้างคูปอง</button>

          {couponMsg && <p>{couponMsg}</p>}
        </div>
      </div>

      {/* LIST */}
      <h2 style={{ marginTop: 40 }}>สินค้า</h2>

      {products.map((p) => (
        <div key={p.id} style={productCard}>
          <img src={p.image} width={100} />

          <div>
            <p>{p.name}</p>
            <p>{p.price} บาท</p>
            <p style={{ fontSize: 12 }}>{p.description?.slice(0, 50)}...</p>
          </div>

          <div>
            <button onClick={() => handleEdit(p)}>แก้ไข</button>
            <button onClick={() => deleteProduct(p.id)} style={btnRed}>
              ลบ
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ================= STYLE ================= */

const container = {
  padding: "40px",
  color: "white",
  background: "#020617",
  minHeight: "100vh",
};

const grid = {
  display: "flex",
  gap: "30px",
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
};

const productCard = {
  background: "#1e293b",
  padding: "15px",
  marginTop: "10px",
  display: "flex",
  justifyContent: "space-between",
};

const btnGreen = { background: "#22c55e", color: "white", padding: "10px" };
const btnBlue = { background: "#2563eb", color: "white", padding: "10px" };
const btnRed = { background: "red", color: "white", padding: "6px" };

export default AdminDashboard;