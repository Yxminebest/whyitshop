import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function Coupons() {
  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    const { data } = await supabase
      .from("coupons")
      .select("*");

    setCoupons(data || []);
  };

  const claimCoupon = (code) => {
    localStorage.setItem("coupon", code);
    alert("รับคูปองแล้ว: " + code);
  };

  return (
    <div style={{ padding: "40px", color: "white" }}>
      <h1>🎟 คูปองส่วนลด</h1>

      <div style={grid}>
        {coupons.map((c) => (
          <div key={c.id} style={card}>
            <h2>{c.code}</h2>
            <p>ลด {c.discount}%</p>

            <button
              style={btn}
              onClick={() => claimCoupon(c.code)}
            >
              รับคูปอง
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* STYLE */
const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
  gap: "20px",
  marginTop: "20px",
};

const card = {
  background: "#1e293b",
  padding: "20px",
  borderRadius: "10px",
  textAlign: "center",
};

const btn = {
  background: "#22c55e",
  color: "white",
  border: "none",
  padding: "10px",
  borderRadius: "6px",
  marginTop: "10px",
};

export default Coupons;