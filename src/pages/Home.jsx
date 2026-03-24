import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { supabase } from "../lib/supabase";

function Home() {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true); // เพิ่ม Loading State
  const { addToCart } = useContext(CartContext);

  const categories = ["All", "Mouse", "Keyboard", "Monitor", "Headset"];

  useEffect(() => {
    let isMounted = true; // ตัวช่วยป้องกัน Error เมื่อเปลี่ยนหน้าเร็วๆ

    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (isMounted) {
          setProducts(data || []);
        }
      } catch (err) {
        console.error("Fetch error:", err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProducts();

    return () => {
      isMounted = false; // Cleanup เมื่อออกจากหน้า Home
    };
  }, []);

  const filteredProducts = selectedCategory === "All"
    ? products
    : products.filter((item) => item.category === selectedCategory);

  return (
    <div className="page-container" style={{ paddingBottom: '50px' }}>
      
      {/* HERO SECTION - ส่วนต้อนรับสุดหรู */}
      <div className="hero" style={{ textAlign: 'center', padding: '60px 20px', marginBottom: '20px' }}>
        <h1 className="text-gradient" style={{ fontSize: '3.5rem', fontWeight: '900', letterSpacing: '-2px' }}>
          WHY IT Shop
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: "15px", fontSize: "1.2rem", maxWidth: '600px', margin: '15px auto 0' }}>
          Premium Gaming & IT Gear สำหรับสายเกมและมืออาชีพ
          <br />เลือกสรรอุปกรณ์ที่ดีที่สุดเพื่อชัยชนะของคุณ
        </p>
      </div>

      {/* CATEGORY FILTER - ปุ่มเลือกหมวดหมู่แบบ Glassmorphism */}
      <div style={{ 
        display: "flex", 
        gap: "12px", 
        justifyContent: "center", 
        marginBottom: "50px", 
        flexWrap: "wrap",
        position: 'sticky',
        top: '80px',
        zIndex: 10,
        padding: '10px'
      }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={selectedCategory === cat ? "btn-primary active-cat" : "glass-card"}
            style={{ 
              padding: "12px 28px", 
              cursor: "pointer", 
              borderRadius: "40px",
              border: selectedCategory === cat ? 'none' : '1px solid var(--card-border)',
              fontSize: '14px',
              fontWeight: '600',
              transition: '0.3s all ease',
              boxShadow: selectedCategory === cat ? '0 8px 20px rgba(0,0,0,0.3)' : 'none'
            }}
          >
            {cat === "All" ? "🚀 ทั้งหมด" : cat}
          </button>
        ))}
      </div>

      {/* PRODUCTS GRID */}
      <div className="product-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: '30px' 
      }}>
        {loading ? (
          // แสดง Skeleton หรือข้อความขณะโหลด
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '50px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>กำลังเตรียมสินค้าพรีเมียม...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '50px' }}>
            <p style={{ color: 'var(--danger)' }}>❌ ขออภัย ไม่พบสินค้าในหมวดหมู่นี้</p>
          </div>
        ) : (
          filteredProducts.map((item) => (
            <div className="glass-card" key={item.id} style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              height: '100%',
              borderRadius: '20px',
              overflow: 'hidden',
              transition: 'transform 0.3s ease'
            }}>
              <div style={{ overflow: 'hidden', height: '220px' }}>
                 <img 
                  src={item.image || "https://via.placeholder.com/400x300"} 
                  alt={item.name} 
                  className="product-img" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              
              <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ textAlign: "center", marginBottom: '20px', flex: 1 }}>
                  <h3 style={{ fontSize: "1.1rem", marginBottom: "10px", fontWeight: '700' }}>{item.name}</h3>
                  <p style={{ 
                    color: "var(--primary)", 
                    fontWeight: "800", 
                    fontSize: "1.3rem", 
                  }}>
                    {Number(item.price).toLocaleString()} <span style={{ fontSize: '14px' }}>บาท</span>
                  </p>
                </div>

                <div style={{ display: "flex", gap: "10px", flexDirection: "column" }}>
                  <button 
                    className="btn-success" 
                    onClick={() => addToCart(item)}
                    style={{ padding: '12px', fontWeight: '700', borderRadius: '12px' }}
                  >
                    🛒 Add to Cart
                  </button>
                  <Link 
                    to={`/product/${item.id}`} 
                    className="btn-primary" 
                    style={{ 
                      background: "transparent", 
                      border: "1px solid var(--card-border)", 
                      color: "var(--text-main)",
                      textAlign: 'center',
                      padding: '10px',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      fontSize: '14px'
                    }}
                  >
                    ดูรายละเอียด
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Home;