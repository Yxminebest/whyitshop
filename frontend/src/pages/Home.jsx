import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";

const API_URL = import.meta.env.VITE_API_URL;

function Home() {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    fetchProducts();
  }, []);

  // 🔥 ดึงข้อมูลจาก Backend (ไม่ใช้ supabase ตรงแล้ว)
  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/products`);
      const data = await res.json();
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ["All", "Mouse", "Keyboard", "Monitor", "Headset"];

  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter((item) => item.category === selectedCategory);

  return (
    <div className="page-container">
      {/* HERO */}
      <div className="hero">
        <h1 className="text-gradient">WHY IT Shop</h1>
      </div>

      {/* CATEGORY */}
      <div
        style={{
          display: "flex",
          gap: "15px",
          justifyContent: "center",
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
              padding: "10px 25px",
              cursor: "pointer",
              borderRadius: "30px",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* LOADING */}
      {loading ? (
        <p style={{ textAlign: "center" }}>⏳ Loading...</p>
      ) : (
        <div className="product-grid">
          {filteredProducts.length === 0 ? (
            <p style={{ textAlign: "center" }}>❌ ไม่มีสินค้า</p>
          ) : (
            filteredProducts.map((item) => (
              <div className="glass-card" key={item.id}>
                <img
                  src={item.image || "https://via.placeholder.com/400"}
                  alt={item.name}
                  className="product-img"
                />

                <div style={{ textAlign: "center" }}>
                  <h3
                    style={{
                      fontSize: "18px",
                      marginBottom: "10px",
                    }}
                  >
                    {item.name}
                  </h3>

                  <p
                    style={{
                      color: "var(--primary)",
                      fontWeight: "bold",
                      fontSize: "18px",
                      marginBottom: "20px",
                    }}
                  >
                    {item.price} บาท
                  </p>

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      flexDirection: "column",
                    }}
                  >
                    <button
                      className="btn-success"
                      onClick={() => addToCart(item)}
                    >
                      🛒 Add to Cart
                    </button>

                    <Link
                      to={`/product/${item.id}`}
                      className="btn-primary"
                      style={{
                        background: "transparent",
                        border: "1px solid var(--primary)",
                        color: "var(--primary)",
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

export default Home;