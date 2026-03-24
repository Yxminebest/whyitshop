import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { supabase } from "../lib/supabase";

function Home() {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*");
    setProducts(data || []);
  };

  const categories = ["All", "Mouse", "Keyboard", "Monitor", "Headset"];

  const filteredProducts = selectedCategory === "All"
    ? products
    : products.filter((item) => item.category === selectedCategory);

  return (
    <div className="page-container">
      {/* HERO SECTION */}
      <div className="hero">
        <h1 className="text-gradient">WHY IT Shop</h1>
      </div>

      {/* CATEGORY */}
      <div style={{ display: "flex", gap: "15px", justifyContent: "center", marginBottom: "40px", flexWrap: "wrap" }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={selectedCategory === cat ? "btn-primary" : "glass-card"}
            style={{ padding: "10px 25px", cursor: "pointer", borderRadius: "30px" }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* PRODUCTS */}
      <div className="product-grid">
        {filteredProducts.map((item) => (
          <div className="glass-card" key={item.id}>
            <img src={item.image || "https://via.placeholder.com/400"} alt={item.name} className="product-img" />
            
            <div style={{ textAlign: "center" }}>
              <h3 style={{ fontSize: "18px", marginBottom: "10px" }}>{item.name}</h3>
              <p style={{ color: "var(--primary)", fontWeight: "bold", fontSize: "18px", marginBottom: "20px" }}>
                {item.price} บาท
              </p>

              <div style={{ display: "flex", gap: "10px", flexDirection: "column" }}>
                <button className="btn-success" onClick={() => addToCart(item)}>
                  🛒 Add to Cart
                </button>
                <Link to={`/product/${item.id}`} className="btn-primary" style={{ background: "transparent", border: "1px solid var(--primary)", color: "var(--primary)" }}>
                  ดูรายละเอียด
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;