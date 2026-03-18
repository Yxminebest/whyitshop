import { useEffect, useState, useContext } from "react"
import { supabase } from "../lib/supabase"
import { CartContext } from "../context/CartContext"
import { Link } from "react-router-dom"

function Products(){

const [products,setProducts] = useState([])
const [search,setSearch] = useState("")
const [loading,setLoading] = useState(true)

const { addToCart } = useContext(CartContext)

/* ================= FETCH PRODUCTS ================= */

useEffect(() => {
  fetchProducts()
}, [])

const fetchProducts = async () => {
  const { data, error } = await supabase
    .from("products")
    .select("*")

  if (error) {
    console.log(error)
  } else {
    setProducts(data)
  }
}

/* ================= SEARCH FILTER ================= */

const filteredProducts = products.filter((product)=>
product.name.toLowerCase().includes(search.toLowerCase())
)

/* ================= LOADING ================= */

if(loading){
return(
<div style={{padding:"40px",color:"white"}}>
กำลังโหลดสินค้า...
</div>
)
}

/* ================= UI ================= */

return(

<div style={{padding:"40px",color:"white"}}>

<h1>🛒 สินค้าทั้งหมด</h1>

{/* SEARCH */}

<input
type="text"
placeholder="ค้นหาสินค้า..."
value={search}
onChange={(e)=>setSearch(e.target.value)}
style={searchBox}
/>

<div style={grid}>

{filteredProducts.length === 0 ?(

<p>ไม่พบสินค้า</p>

):(filteredProducts.map((product)=>(

<div key={product.id} style={card}>

<img
src={product.image}
alt={product.name}
style={image}
/>

<h3 style={{marginTop:"10px"}}>
{product.name}
</h3>

<p style={{marginTop:"5px"}}>
{product.price} บาท
</p>

<div style={{marginTop:"10px"}}>

<Link
to={`/product/${product.id}`}
style={{textDecoration:"none"}}
>

<button style={detailBtn}>
ดูสินค้า
</button>

</Link>

<button
onClick={()=>addToCart(product)}
style={cartBtn}
>
ใส่ตะกร้า
</button>

</div>

</div>

)))}

</div>

</div>

)

}

/* ================= STYLE ================= */

const searchBox={
padding:"10px",
width:"300px",
borderRadius:"8px",
border:"none",
marginTop:"20px"
}

const grid={
display:"grid",
gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",
gap:"20px",
marginTop:"30px"
}

const card={
background:"#1e293b",
padding:"20px",
borderRadius:"10px",
textAlign:"center"
}

const image={
width:"100%",
height:"160px",
objectFit:"cover",
borderRadius:"8px"
}

const detailBtn={
background:"#2563eb",
color:"white",
border:"none",
padding:"8px 15px",
borderRadius:"6px",
marginRight:"5px",
cursor:"pointer"
}

const cartBtn={
background:"#22c55e",
color:"white",
border:"none",
padding:"8px 15px",
borderRadius:"6px",
cursor:"pointer"
}

export default Products