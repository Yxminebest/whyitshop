import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

function Profile(){

const [user,setUser] = useState(null)

const [username,setUsername] = useState("")
const [firstname,setFirstname] = useState("")
const [lastname,setLastname] = useState("")
const [phone,setPhone] = useState("")
const [address,setAddress] = useState("")

const [loading,setLoading] = useState(false)

/* ================= GET USER ================= */

useEffect(()=>{

getUser()

},[])

const getUser = async ()=>{

const { data } = await supabase.auth.getUser()

if(data?.user){

setUser(data.user)

loadProfile(data.user.id)

}

}

/* ================= LOAD PROFILE ================= */

const loadProfile = async(userId)=>{

const { data, error } = await supabase
.from("users")
.select("*")
.eq("id",userId)
.single()

if(error){

console.log(error)

}else if(data){

setUsername(data.username || "")
setFirstname(data.firstname || "")
setLastname(data.lastname || "")
setPhone(data.phone || "")
setAddress(data.address || "")

}

}

/* ================= SAVE PROFILE ================= */

const saveProfile = async ()=>{

if(!user) return

try{

setLoading(true)

const { error } = await supabase
.from("users")
.upsert({
id:user.id,
email:user.email,
username,
firstname,
lastname,
phone,
address
})

if(error){

console.log(error)
alert("บันทึกไม่สำเร็จ")

}else{

alert("บันทึกข้อมูลแล้ว")

}

}catch(err){

console.log(err)

}

setLoading(false)

}

/* ================= UI ================= */

return(

<div className="profile-page">

<div className="profile-card">

<h2>👤 Personal Settings</h2>

<div className="profile-avatar">

<img
src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
alt="avatar"
/>

</div>

<p className="profile-id">
Profile ID: {user?.id?.slice(0,10)}
</p>

<div className="profile-form">

<input
type="text"
placeholder="Username"
value={username}
onChange={(e)=>setUsername(e.target.value)}
/>

<input
type="text"
placeholder="Firstname"
value={firstname}
onChange={(e)=>setFirstname(e.target.value)}
/>

<input
type="text"
placeholder="Lastname"
value={lastname}
onChange={(e)=>setLastname(e.target.value)}
/>

<input
type="email"
value={user?.email || ""}
disabled
/>

<input
type="text"
placeholder="Phone"
value={phone}
onChange={(e)=>setPhone(e.target.value)}
/>

<input
type="text"
placeholder="Address"
value={address}
onChange={(e)=>setAddress(e.target.value)}
/>

</div>

<button
className="profile-btn"
onClick={saveProfile}
disabled={loading}
>

{loading ? "Saving..." : "Submit"}

</button>

</div>

</div>

)

}

export default Profile