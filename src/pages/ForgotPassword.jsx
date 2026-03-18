import { useState } from "react"
import { supabase } from "../lib/supabase"

function ForgotPassword(){

const [email,setEmail] = useState("")
const [loading,setLoading] = useState(false)

const resetPassword = async () => {

if(!email){
alert("กรุณากรอกอีเมล")
return
}

try{

setLoading(true)

const { error } = await supabase.auth.resetPasswordForEmail(email, {
redirectTo: "http://localhost:5173/reset-password"
})

if(error){

alert(error.message)

}else{

alert("ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลแล้ว")

}

}catch(err){

console.log(err)

}

setLoading(false)

}

return(

<div style={container}>

<h1>Forgot Password</h1>

<input
type="email"
placeholder="กรอกอีเมล"
value={email}
onChange={(e)=>setEmail(e.target.value)}
style={input}
/>

<button
onClick={resetPassword}
disabled={loading}
style={button}
>

{loading ? "Sending..." : "Reset Password"}

</button>

</div>

)

}

/* ================= STYLE ================= */

const container={
padding:"40px",
color:"white"
}

const input={
padding:"10px",
width:"300px",
marginTop:"10px",
borderRadius:"6px",
border:"none"
}

const button={
marginTop:"10px",
padding:"10px",
background:"#2563eb",
color:"white",
border:"none",
borderRadius:"6px",
cursor:"pointer"
}

export default ForgotPassword