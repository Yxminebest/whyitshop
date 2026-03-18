import { useState } from "react"
import { supabase } from "../lib/supabase"
import { useNavigate } from "react-router-dom"

/* ================= SANITIZE INPUT ================= */

const sanitizeInput = (text) => {
if(!text) return ""
return text
.replace(/</g,"")
.replace(/>/g,"")
.replace(/script/gi,"")
.replace(/'/g,"")
.replace(/"/g,"")
}

function Register(){

const navigate = useNavigate()

const [firstName,setFirstName] = useState("")
const [lastName,setLastName] = useState("")
const [username,setUsername] = useState("")
const [email,setEmail] = useState("")
const [password,setPassword] = useState("")
const [confirmPassword,setConfirmPassword] = useState("")
const [newsletter,setNewsletter] = useState(false)
const [loading,setLoading] = useState(false)

/* ================= REGISTER ================= */

const handleRegister = async ()=>{

if(!firstName || !lastName || !username || !email || !password){
alert("กรุณากรอกข้อมูลให้ครบ")
return
}

if(password.length < 6){
alert("รหัสผ่านต้องอย่างน้อย 6 ตัว")
return
}

if(password !== confirmPassword){
alert("รหัสผ่านไม่ตรงกัน")
return
}

try{

setLoading(true)

const safeFirstName = sanitizeInput(firstName)
const safeLastName = sanitizeInput(lastName)
const safeUsername = sanitizeInput(username)

/* ================= CREATE USER ================= */

const { data, error } = await supabase.auth.signUp({
email: email,
password: password
})

if(error){
alert(error.message)
setLoading(false)
return
}

const user = data.user

/* ================= SAVE PROFILE ================= */

await supabase
.from("users")
.insert({
id: user.id,
email: email,
firstname: safeFirstName,
lastname: safeLastName,
username: safeUsername,
newsletter: newsletter,
role: "customer",
created_at: new Date()
})

alert("สมัครสมาชิกสำเร็จ")

navigate("/login")

}catch(err){

console.log(err)
alert(err.message)

}

setLoading(false)

}

/* ================= UI ================= */

return(

<div className="register-page">

<div className="register-card">

<h2>Registration</h2>

<input
type="text"
placeholder="First Name"
value={firstName}
onChange={(e)=>setFirstName(e.target.value)}
/>

<input
type="text"
placeholder="Last Name"
value={lastName}
onChange={(e)=>setLastName(e.target.value)}
/>

<input
type="text"
placeholder="Username"
value={username}
onChange={(e)=>setUsername(e.target.value)}
/>

<input
type="email"
placeholder="Email Address"
value={email}
onChange={(e)=>setEmail(e.target.value)}
/>

<input
type="password"
placeholder="Password (ขั้นต่ำ 6 ตัว)"
value={password}
onChange={(e)=>setPassword(e.target.value)}
/>

<input
type="password"
placeholder="Confirm Password"
value={confirmPassword}
onChange={(e)=>setConfirmPassword(e.target.value)}
/>

<label className="newsletter">

<input
type="checkbox"
checked={newsletter}
onChange={(e)=>setNewsletter(e.target.checked)}
/>

Subscribe to Newsletter

</label>

<div className="register-buttons">

<button
className="register-btn-main"
onClick={handleRegister}
disabled={loading}
>

{loading ? "Loading..." : "REGISTER"}

</button>

<button
className="cancel-btn"
onClick={()=>navigate("/login")}
>

CANCEL

</button>

</div>

</div>

</div>

)

}

export default Register