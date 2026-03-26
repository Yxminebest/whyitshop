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
    const fetchProducts = async () => {
      const { data } = await supabase.from("products").select("*");
      setProducts(data || []);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter((product) =>
    product.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <h1 style={{ marginBottom: "20px", fontWeight: "800" }}>🛒 สินค้าทั้งหมด</h1>

      <input
        type="text"
        className="input-glass"
        placeholder="🔍 ค้นหาสินค้า..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ maxWidth: "400px", marginBottom: "40px" }}
      />

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>กำลังโหลดสินค้า...</p>
      ) : (
        <div className="product-grid">
          {filteredProducts.length === 0 ? (
            <p style={{ color: "var(--danger)" }}>ไม่พบสินค้าที่ค้นหา</p>
          ) : (
            filteredProducts.map((product) => (
              <div key={product.id} className="glass-card" style={{ display: "flex", flexDirection: "column" }}>
                <img src={product.image || "https://via.placeholder.com/200"} alt={product.name} className="product-img" />
                
                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <h3 style={{ fontSize: "18px", marginBottom: "10px" }}>{product.name}</h3>
                    <p style={{ color: "var(--primary)", fontWeight: "bold", fontSize: "18px" }}>{product.price} บาท</p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "20px" }}>
                    <button onClick={() => addToCart(product)} className="btn-success" style={{ width: "100%" }}>
                      🛒 ใส่ตะกร้า
                    </button>
                    <Link to={`/product/${product.id}`} className="btn-primary" style={{ background: "transparent", color: "var(--text-main)", border: "1px solid var(--card-border)", width: "100%" }}>
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