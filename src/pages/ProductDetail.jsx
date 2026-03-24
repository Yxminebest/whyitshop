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
    let isMounted = true;
    
    const fetchProductData = async () => {
      try {
        setLoading(true);
        // 1. ดึงข้อมูลสินค้าหลัก
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        if (isMounted) {
          setProduct(data);
          // 2. ดึงสินค้าที่เกี่ยวข้อง (หมวดหมู่เดียวกัน)
          const { data: relatedData } = await supabase
            .from("products")
            .select("*")
            .eq("category", data.category)
            .neq("id", data.id)
            .limit(4);
          
          setRelated(relatedData || []);
        }
      } catch (err) {
        console.error("Error fetching product:", err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProductData();
    window.scrollTo(0, 0); // เลื่อนขึ้นบนสุดเมื่อเปลี่ยนหน้าสินค้า

    return () => { isMounted = false; };
  }, [id]);

  const handleAddToCart = () => {
    if (qty < 1) return;
    
    // ✅ ปรับปรุง: ส่งสินค้าพร้อมจำนวนไปที่ Context แทนการวน Loop (ถ้า Context รองรับ qty)
    // หรือถ้า Context รับทีละชิ้น ก็ใช้ Loop เดิมแต่จำกัดจำนวนเพื่อความปลอดภัย
    for (let i = 0; i < qty; i++) {
      addToCart(product);
    }
    
    setMessage(`เพิ่ม ${product.name} จำนวน ${qty} ชิ้นเรียบร้อย! ✔`);
    setTimeout(() => setMessage(""), 3000);
  };

  if (loading) return (
    <div className="page-container" style={{ textAlign: 'center', padding: '100px' }}>
      <h2 style={{ color: 'var(--text-muted)' }}>กำลังดึงข้อมูลสินค้าพรีเมียม...</h2>
    </div>
  );

  if (!product) return (
    <div className="page-container" style={{ textAlign: 'center', padding: '100px' }}>
      <h2 style={{ color: 'var(--danger)' }}>❌ ไม่พบข้อมูลสินค้า</h2>
      <button onClick={() => navigate('/products')} className="btn-primary" style={{ marginTop: '20px' }}>กลับไปดูสินค้าทั้งหมด</button>
    </div>
  );

  return (
    <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      <button 
        onClick={() => navigate(-1)} 
        className="btn-primary" 
        style={{ 
          background: "rgba(255,255,255,0.05)", 
          color: "var(--text-main)", 
          border: "1px solid var(--card-border)", 
          marginBottom: "30px",
          padding: '8px 20px',
          borderRadius: '10px'
        }}
      >
        ⬅ ย้อนกลับ
      </button>

      <div className="glass-card" style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", 
        gap: "50px", 
        padding: "50px",
        borderRadius: '30px',
        alignItems: 'center'
      }}>
        
        {/* LEFT: Product Image */}
        <div style={{ position: 'relative' }}>
          <img 
            src={product.image || "https://via.placeholder.com/600x600"} 
            alt={product.name} 
            style={{ 
              width: "100%", 
              borderRadius: "24px", 
              objectFit: "cover", 
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
              border: '1px solid var(--card-border)'
            }} 
          />
          <span style={{ 
            position: 'absolute', top: '20px', left: '20px', 
            background: 'var(--primary)', color: 'white', 
            padding: '5px 15px', borderRadius: '30px', fontSize: '12px', fontWeight: '800'
          }}>
            {product.category.toUpperCase()}
          </span>
        </div>

        {/* RIGHT: Product Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h1 style={{ fontSize: "2.5rem", fontWeight: "900", marginBottom: "10px", lineHeight: '1.2' }}>{product.name}</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "16px" }}>
              หมวดหมู่: <span style={{ color: "var(--primary)", fontWeight: "700" }}>{product.category}</span>
            </p>
          </div>
          
          <h2 style={{ color: "var(--accent)", fontSize: "2.2rem", fontWeight: '900' }}>
            {Number(product.price).toLocaleString()} <span style={{ fontSize: '18px' }}>บาท</span>
          </h2>

          <div style={{ 
            background: "rgba(255,255,255,0.02)", 
            padding: "25px", 
            borderRadius: "16px", 
            border: "1px solid var(--card-border)",
            lineHeight: "1.8"
          }}>
            <h3 style={{ marginBottom: "10px", fontSize: "18px", color: 'var(--text-main)' }}>รายละเอียดสินค้า</h3>
            <p style={{ color: "var(--text-muted)" }}>{product.description || "สินค้านี้ยังไม่มีคำอธิบายโดยละเอียด"}</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "20px", marginTop: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', borderRadius: '12px', padding: '5px' }}>
              <button 
                onClick={() => setQty(Math.max(1, qty - 1))}
                style={{ background: 'none', border: 'none', color: 'white', padding: '10px 15px', cursor: 'pointer', fontSize: '1.2rem' }}
              >-</button>
              <input 
                type="number" 
                min="1" 
                className="input-glass" 
                style={{ width: "60px", marginBottom: "0", border: 'none', textAlign: 'center', background: 'transparent', fontSize: '1.1rem', fontWeight: '800' }} 
                value={qty} 
                onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} 
              />
              <button 
                onClick={() => setQty(qty + 1)}
                style={{ background: 'none', border: 'none', color: 'white', padding: '10px 15px', cursor: 'pointer', fontSize: '1.2rem' }}
              >+</button>
            </div>
            
            <button 
              onClick={handleAddToCart} 
              className="btn-success" 
              style={{ padding: "15px 40px", fontSize: "16px", flex: 1, fontWeight: '800', borderRadius: '12px', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
            >
              🛒 Add to Cart
            </button>
          </div>
          
          {message && (
            <div style={{ 
              background: 'rgba(34, 197, 94, 0.1)', color: 'var(--accent)', 
              padding: '12px', borderRadius: '10px', textAlign: 'center', fontWeight: '700', border: '1px solid var(--accent)' 
            }}>
              {message}
            </div>
          )}
        </div>
      </div>

      {/* RELATED PRODUCTS */}
      {related.length > 0 && (
        <div style={{ marginTop: "80px" }}>
          <h2 style={{ marginBottom: "30px", fontSize: '1.8rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '15px' }}>
            🔥 สินค้าใกล้เคียง <div style={{ flex: 1, height: '1px', background: 'var(--card-border)' }}></div>
          </h2>
          <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '25px' }}>
            {related.map((item) => (
              <div 
                key={item.id} 
                className="glass-card" 
                onClick={() => navigate(`/product/${item.id}`)} 
                style={{ cursor: "pointer", transition: '0.3s all ease', padding: "20px", borderRadius: '20px', textAlign: 'center' }}
              >
                <div style={{ overflow: 'hidden', borderRadius: '15px', height: '180px', marginBottom: '15px' }}>
                  <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <h4 style={{ fontSize: "16px", marginBottom: "8px", fontWeight: '700' }}>{item.name}</h4>
                <p style={{ color: "var(--primary)", fontWeight: "800" }}>{Number(item.price).toLocaleString()} บาท</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductDetail;