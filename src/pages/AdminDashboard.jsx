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

  /* ================= LOAD ================= */

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase.from("products").select("*");

    if (error) {
      console.log("❌ fetch error:", error);
    } else {
      console.log("✅ products:", data);
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

      /* ===== FIX ชื่อไฟล์ ===== */
      if (image) {
        const cleanName = image.name
          .replace(/\s+/g, "_")
          .replace(/[^a-zA-Z0-9._-]/g, "");

        const fileName = Date.now() + "_" + cleanName;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(fileName, image);

        if (uploadError) {
          console.log(uploadError);
          alert("อัปโหลดรูปไม่สำเร็จ");
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
          alert("แก้ไขไม่สำเร็จ");
        } else {
          alert("แก้ไขสินค้าแล้ว");
        }

        setEditId(null);
      }

      /* ===== INSERT ===== */
      else {
        if (!imageUrl) {
          alert("กรุณาใส่รูปสินค้า");
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
          alert("เพิ่มสินค้าไม่สำเร็จ");
        } else {
          alert("เพิ่มสินค้าแล้ว");
        }
      }

      /* ===== RESET ===== */
      setName("");
      setPrice("");
      setCategory("");
      setImage(null);

      /* 🔥 สำคัญ: refresh */
      await fetchProducts();

    } catch (err) {
      console.log("❌ error:", err);
    }

    setLoading(false);
  };

  /* ================= DELETE ================= */

  const deleteProduct = async (id) => {
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      console.log(error);
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

  /* ================= UI ================= */

  return (
    <div style={{ padding: "40px", color: "white" }}>
      <h1>🛠 Admin Dashboard</h1>

      {/* FORM */}
      <h2 style={{ marginTop: "30px" }}>เพิ่มสินค้า</h2>

      <div style={formBox}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ชื่อสินค้า"
          style={input}
        />

        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          type="number"
          placeholder="ราคา"
          style={input}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={input}
        >
          <option value="">หมวดหมู่</option>
          <option>Mouse</option>
          <option>Keyboard</option>
          <option>Monitor</option>
          <option>Headset</option>
        </select>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
          style={input}
        />

        <button onClick={saveProduct} style={addBtn} disabled={loading}>
          {loading ? "กำลังบันทึก..." : editId ? "บันทึก" : "เพิ่มสินค้า"}
        </button>
      </div>

      {/* LIST */}
      <h2 style={{ marginTop: "40px" }}>สินค้า</h2>

      {products.length === 0 ? (
        <p>❌ ไม่มีสินค้า</p>
      ) : (
        products.map((p) => (
          <div key={p.id} style={card}>
            <div>
              <img
                src={p.image}
                width={120}
                onError={(e) =>
                  (e.target.src =
                    "https://via.placeholder.com/120?text=No+Image")
                }
              />
              <p>{p.name}</p>
              <p>{p.price} บาท</p>
            </div>

            <div>
              <button onClick={() => handleEdit(p)}>แก้ไข</button>
              <button
                onClick={() => deleteProduct(p.id)}
                style={deleteBtn}
              >
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
const formBox = {
  background: "#020617",
  padding: "20px",
  borderRadius: "12px",
  width: "400px",
};

const input = {
  width: "100%",
  padding: "10px",
  marginBottom: "10px",
};

const addBtn = {
  background: "green",
  color: "white",
  padding: "10px",
};

const deleteBtn = {
  background: "red",
  color: "white",
  padding: "8px",
};

const card = {
  background: "#1e293b",
  padding: "15px",
  marginTop: "10px",
  display: "flex",
  justifyContent: "space-between",
};

export default AdminDashboard;