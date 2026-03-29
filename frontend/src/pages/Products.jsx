import { useEffect, useState, useContext } from "react";
import { supabase } from "../lib/supabase";
import { CartContext } from "../context/CartContext";
import { Link } from "react-router-dom";
import { getProducts } from "../api/productApi";

function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const { addToCart } = useContext(CartContext);

  const categories = ["All", "CPU", "Mainboard", "GPU", "RAM", "Storage", "Keyboard", "Headset", "Mouse", "Monitor"];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await getProducts();
        setProducts(data || []);
      } catch (error) {
        console.error("Failed to load products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchSearch = product.name?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory === "All" || product.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="page-container">
      <h1 style={{ marginBottom: "20px", fontWeight: "800" }}>🛒 สินค้าทั้งหมด</h1>

      {/* SEARCH */}
      <input
        type="text"
        className="input-glass"
        placeholder="🔍 ค้นหาสินค้า..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ maxWidth: "400px", marginBottom: "25px" }}
      />

      {/* CATEGORIES */}
      <div
        style={{
          display: "flex",
          gap: "15px",
          marginBottom: "40px",
          flexWrap: "wrap",
        }}
      >
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={selectedCategory === cat ? "btn-primary" : "glass-card"}
            style={{
              padding: "8px 20px",
              cursor: "pointer",
              borderRadius: "25px",
              fontSize: "14px",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* PRODUCTS */}
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