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

  /* ================= LOAD ================= */

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.log(error);
    } else {
      setProduct(data);
      fetchRelated(data);
    }

    setLoading(false);
  };

  /* ================= RELATED ================= */

  const fetchRelated = async (currentProduct) => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("category", currentProduct.category)
      .neq("id", currentProduct.id)
      .limit(3);

    setRelated(data || []);
  };

  /* ================= ADD TO CART ================= */

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) {
      addToCart(product);
    }

    setMessage("เพิ่มสินค้าในตะกร้าแล้ว ✔");

    setTimeout(() => {
      setMessage("");
    }, 2000);
  };

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div style={{ padding: "40px", color: "white" }}>
        <h2>กำลังโหลดสินค้า...</h2>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ padding: "40px", color: "white" }}>
        ไม่พบสินค้า
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div style={{ padding: "40px", color: "white" }}>
      {/* BACK BUTTON */}
      <button onClick={() => navigate(-1)} style={backBtn}>
        ⬅ กลับ
      </button>

      <div style={container}>
        {/* IMAGE */}
        <img
          src={product.image || "https://via.placeholder.com/400"}
          alt={product.name}
          style={image}
        />

        {/* INFO */}
        <div style={info}>
          <h1>{product.name}</h1>

          <p style={{ fontSize: "18px", marginTop: "10px" }}>
            หมวดหมู่: {product.category}
          </p>

          <h2 style={{ color: "#22c55e", marginTop: "20px" }}>
            {product.price} บาท
          </h2>

          {/* QUANTITY */}
          <div style={{ marginTop: "20px" }}>
            <span>จำนวน: </span>
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              style={qtyInput}
            />
          </div>

          {/* BUTTON */}
          <button onClick={handleAddToCart} style={button}>
            🛒 เพิ่มลงตะกร้า
          </button>

          {/* MESSAGE */}
          {message && (
            <p style={{ color: "#22c55e", marginTop: "10px" }}>
              {message}
            </p>
          )}
        </div>
      </div>

      {/* RELATED PRODUCTS */}
      <h2 style={{ marginTop: "50px" }}>🔥 สินค้าใกล้เคียง</h2>

      <div style={grid}>
        {related.length === 0 ? (
          <p>ไม่มีสินค้า</p>
        ) : (
          related.map((item) => (
            <div
              key={item.id}
              style={card}
              onClick={() => navigate(`/product/${item.id}`)}
            >
              <img
                src={item.image}
                style={relatedImg}
                alt=""
              />

              <h4>{item.name}</h4>
              <p>{item.price} บาท</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ================= STYLE ================= */

const container = {
  display: "flex",
  gap: "40px",
  background: "#1e293b",
  padding: "30px",
  borderRadius: "12px",
  alignItems: "center",
};

const image = {
  width: "350px",
  borderRadius: "12px",
};

const info = {
  flex: 1,
};

const button = {
  marginTop: "20px",
  background: "#22c55e",
  color: "white",
  padding: "12px 20px",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "16px",
};

const qtyInput = {
  width: "60px",
  padding: "5px",
  marginLeft: "10px",
  borderRadius: "6px",
};

const backBtn = {
  marginBottom: "20px",
  background: "#334155",
  color: "white",
  border: "none",
  padding: "8px 12px",
  borderRadius: "6px",
  cursor: "pointer",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
  gap: "20px",
  marginTop: "20px",
};

const card = {
  background: "#1e293b",
  padding: "15px",
  borderRadius: "10px",
  cursor: "pointer",
  textAlign: "center",
};

const relatedImg = {
  width: "100%",
  height: "150px",
  objectFit: "cover",
  borderRadius: "8px",
};

export default ProductDetail;