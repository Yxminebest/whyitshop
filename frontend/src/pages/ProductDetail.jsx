import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { CartContext } from "../context/CartContext";

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
    if (error) console.log(error);
    else {
      setProduct(data);
      fetchRelated(data);
    }
    setLoading(false);
  };

  const fetchRelated = async (currentProduct) => {
    const { data } = await supabase.from("products").select("*").eq("category", currentProduct.category).neq("id", currentProduct.id).limit(4);
    setRelated(data || []);
  };

  const handleAddToCart = () => {
    if (qty < 1) return;
    for (let i = 0; i < qty; i++) addToCart(product);
    setMessage("เพิ่มสินค้าในตะกร้าแล้ว ✔");
    setTimeout(() => setMessage(""), 2500);
  };

  if (loading) return <div className="page-container"><h2 style={{ textAlign: "center", marginTop: "50px" }}>กำลังโหลดข้อมูลสินค้า...</h2></div>;
  if (!product) return <div className="page-container"><h2 style={{ textAlign: "center", marginTop: "50px" }}>ไม่พบข้อมูลสินค้า</h2></div>;

  return (
    <div className="page-container">
      <button onClick={() => navigate(-1)} className="btn-primary" style={{ background: "var(--bg-secondary)", color: "var(--text-main)", border: "1px solid var(--card-border)", marginBottom: "20px" }}>
        ⬅ ย้อนกลับ
      </button>

      <div className="glass-card" style={{ display: "flex", flexWrap: "wrap", gap: "40px", alignItems: "flex-start", padding: "40px" }}>
        
        <div style={{ flex: "1 1 350px" }}>
          <img src={product.image || "https://via.placeholder.com/400"} alt={product.name} style={{ width: "100%", borderRadius: "16px", objectFit: "cover", boxShadow: "var(--shadow)" }} />
        </div>

        <div style={{ flex: "2 1 400px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: "800", marginBottom: "10px" }}>{product.name}</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "16px", marginBottom: "20px" }}>หมวดหมู่: <span style={{ color: "var(--primary)", fontWeight: "bold" }}>{product.category}</span></p>
          
          <h2 style={{ color: "var(--accent)", fontSize: "28px", marginBottom: "25px" }}>{product.price} บาท</h2>

          <div style={{ background: "var(--bg-secondary)", padding: "20px", borderRadius: "12px", marginBottom: "25px", border: "1px solid var(--card-border)" }}>
            <h3 style={{ marginBottom: "10px", fontSize: "18px" }}>รายละเอียดสินค้า</h3>
            <p style={{ color: "var(--text-muted)", lineHeight: "1.7" }}>{product.description || "ไม่มีรายละเอียดสินค้า"}</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "20px" }}>
            <span style={{ fontWeight: "bold" }}>จำนวน: </span>
            <input type="number" min="1" className="input-glass" style={{ width: "80px", marginBottom: "0" }} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} />
          </div>

          <button onClick={handleAddToCart} className="btn-success" style={{ padding: "15px 30px", fontSize: "16px", width: "100%", maxWidth: "300px" }}>
            🛒 เพิ่มลงตะกร้า ({qty} ชิ้น)
          </button>
          
          {message && <p style={{ color: "var(--accent)", marginTop: "15px", fontWeight: "bold" }}>{message}</p>}
        </div>
      </div>

      {related.length > 0 && (
        <div style={{ marginTop: "60px" }}>
          <h2 style={{ marginBottom: "25px", borderLeft: "4px solid var(--primary)", paddingLeft: "15px" }}>🔥 สินค้าใกล้เคียง</h2>
          <div className="product-grid">
            {related.map((item) => (
              <div key={item.id} className="glass-card" onClick={() => navigate(`/product/${item.id}`)} style={{ cursor: "pointer", textAlign: "center", padding: "20px" }}>
                <img src={item.image} alt={item.name} style={{ width: "100%", height: "180px", objectFit: "cover", borderRadius: "12px", marginBottom: "15px" }} />
                <h4 style={{ fontSize: "16px", marginBottom: "8px" }}>{item.name}</h4>
                <p style={{ color: "var(--primary)", fontWeight: "bold" }}>{item.price} บาท</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductDetail;