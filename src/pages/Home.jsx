import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { supabase } from "../lib/supabase";

function Home() {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { addToCart } = useContext(CartContext);

  // 🔥 โหลดข้อมูลจาก Supabase
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*");

    if (error) {
      console.error("Error fetching products:", error.message);
    } else {
      setProducts(data || []);
    }
  };

  // 📦 หมวดหมู่
  const categories = ["All", "Mouse", "Keyboard", "Monitor", "Headset"];

  // 🔍 filter
  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter(
          (item) => item.category === selectedCategory
        );

  return (
    <div className="container">
      {/* HERO SECTION */}
      <div className="hero">
        <h1>WHY IT Shop</h1>
        <p>Premium Gaming & IT Gear สำหรับสายเกมและมืออาชีพ</p>
      </div>

      {/* CATEGORY */}
      <div className="category-bar">
        {categories.map((cat) => (
          <button
            key={cat}
            className={
              selectedCategory === cat
                ? "category-btn active"
                : "category-btn"
            }
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* PRODUCTS */}
      <div className="product-grid">
        {filteredProducts.map((item) => (
          <div className="product-card" key={item.id}>
            <div className="image-wrapper">
              <img
                src={
                  item.image ||
                  "https://via.placeholder.com/400"
                }
                alt={item.name}
              />
              {/* ❌ ลบ SALE ออกแล้ว */}
            </div>

            <div className="product-info">
              <h3>{item.name}</h3>
              <p className="price">{item.price} บาท</p>

              <div className="btn-group">
                <button
                  className="cart-btn"
                  onClick={() => addToCart(item)}
                >
                  🛒 Add to Cart
                </button>

                <Link
                  to={`/product/${item.id}`}
                  className="detail-btn"
                >
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