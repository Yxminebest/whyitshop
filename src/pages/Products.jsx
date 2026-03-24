import { useEffect, useState, useContext } from "react";
import { supabase } from "../lib/supabase";
import { CartContext } from "../context/CartContext";
import { Link } from "react-router-dom";

function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    let isMounted = true; // 🚩 ตัวช่วยป้องกัน Error ตอนเปลี่ยนหน้า

    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order('id', { ascending: true }); // เรียงลำดับให้สวยงาม

        if (error) throw error;

        if (isMounted) {
          setProducts(data || []);
        }
      } catch (err) {
        console.error("Fetch products error:", err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProducts();

    return () => {
      isMounted = false; // 🚩 ล้างสถานะเมื่อ Component ถูกปิด
    };
  }, []);

  const filteredProducts = products.filter((product) =>
    product.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container" style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: "20px", fontWeight: "800", fontSize: '2.5rem' }}>
        🛒 สินค้าทั้งหมด
      </h1>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
        <input
          type="text"
          className="input-glass"
          placeholder="🔍 ค้นหาสินค้าที่คุณต้องการ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ 
            maxWidth: "500px", 
            width: '100%',
            padding: '12px 20px',
            borderRadius: '12px',
            border: '1px solid var(--card-border)',
            background: 'var(--bg-card)',
            color: 'var(--text-main)'
          }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p style={{ color: "var(--text-muted)", fontSize: '1.2rem' }}>กำลังโหลดสินค้าสุดพรีเมียม...</p>
        </div>
      ) : (
        <div className="product-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '25px' 
        }}>
          {filteredProducts.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '50px' }}>
              <p style={{ color: "var(--danger)", fontSize: '1.2rem' }}>❌ ไม่พบสินค้าที่ค้นหา</p>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div key={product.id} className="glass-card" style={{ 
                display: "flex", 
                flexDirection: "column",
                borderRadius: '16px',
                overflow: 'hidden',
                transition: 'transform 0.3s ease',
                border: '1px solid var(--card-border)',
                background: 'var(--bg-card)'
              }}>
                <div style={{ overflow: 'hidden', height: '200px' }}>
                   <img 
                    src={product.image || "https://via.placeholder.com/300x200"} 
                    alt={product.name} 
                    className="product-img"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                
                <div style={{ padding: '20px', flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <h3 style={{ fontSize: "18px", marginBottom: "8px", fontWeight: '700' }}>{product.name}</h3>
                    <p style={{ 
                      color: "var(--primary)", 
                      fontWeight: "800", 
                      fontSize: "20px",
                      margin: '10px 0' 
                    }}>
                      {Number(product.price).toLocaleString()} บาท
                    </p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "15px" }}>
                    <button 
                      onClick={() => addToCart(product)} 
                      className="btn-success" 
                      style={{ 
                        width: "100%", 
                        padding: '12px', 
                        borderRadius: '10px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      🛒 ใส่ตะกร้า
                    </button>
                    <Link 
                      to={`/product/${product.id}`} 
                      className="btn-primary" 
                      style={{ 
                        background: "rgba(255,255,255,0.05)", 
                        color: "var(--text-main)", 
                        border: "1px solid var(--card-border)", 
                        width: "100%",
                        textAlign: 'center',
                        padding: '10px',
                        borderRadius: '10px',
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
      )}
    </div>
  );
}

export default Products;