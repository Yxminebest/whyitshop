import { useState } from "react"
import { supabase } from "../lib/supabase"
import { useNavigate } from "react-router-dom"

function ResetPassword(){

const [password,setPassword] = useState("")
const [confirmPassword,setConfirmPassword] = useState("")
const [loading,setLoading] = useState(false)

const navigate = useNavigate()

const updatePassword = async ()=>{

if(!password || !confirmPassword){
alert("กรุณากรอกรหัสผ่าน")
return
}

if(password !== confirmPassword){
alert("รหัสผ่านไม่ตรงกัน")
return
}

try{

setLoading(true)

const { error } = await supabase.auth.updateUser({
password: password
})

if(error){

alert(error.message)

}else{

alert("เปลี่ยนรหัสผ่านสำเร็จ")

navigate("/login")

}

}catch(err){

console.log(err)

}

setLoading(false)

}

return(

<div style={container}>

<h1>Reset Password</h1>

<input
type="password"
placeholder="รหัสผ่านใหม่"
value={password}
onChange={(e)=>setPassword(e.target.value)}
style={input}
/>

<input
type="password"
placeholder="ยืนยันรหัสผ่าน"
value={confirmPassword}
onChange={(e)=>setConfirmPassword(e.target.value)}
style={input}
/>

<button
onClick={updatePassword}
disabled={loading}
style={button}
>

{loading ? "Updating..." : "Update Password"}

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
display:"block",
padding:"10px",
width:"300px",
marginTop:"10px",
borderRadius:"6px",
border:"none"
}

const button={
marginTop:"15px",
padding:"10px",
background:"#22c55e",
color:"white",
border:"none",
borderRadius:"6px",
cursor:"pointer"
}

export default ResetPassword