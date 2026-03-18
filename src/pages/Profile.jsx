import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

function Profile() {

  const [user,setUser] = useState(null)

  const [username,setUsername] = useState("")
  const [firstname,setFirstname] = useState("")
  const [lastname,setLastname] = useState("")
  const [phone,setPhone] = useState("")
  const [address,setAddress] = useState("")

  const [avatar,setAvatar] = useState(null)
  const [preview,setPreview] = useState(null)

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
      setPreview(data.avatar || null) // 🔥 โหลดรูป
    }
  }

  /* ================= UPLOAD AVATAR ================= */

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // validate
    if (!file.type.startsWith("image/")) {
      alert("ต้องเป็นรูปภาพเท่านั้น")
      return
    }

    if (file.size > 2000000) {
      alert("ไฟล์ต้องไม่เกิน 2MB")
      return
    }

    try {

      const fileName = user.id + "_" + Date.now()

      const { error } = await supabase.storage
        .from("avatars")
        .upload(fileName, file)

      if (error) {
        console.log(error)
        alert("อัปโหลดไม่สำเร็จ")
        return
      }

      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName)

      setAvatar(data.publicUrl)
      setPreview(data.publicUrl)

    } catch (err) {
      console.log(err)
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
        address,
        avatar: avatar || preview // 🔥 บันทึกรูป
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

      {/* 🔥 AVATAR */}
      <div className="profile-avatar">

        <img
          src={
            preview ||
            "https://cdn-icons-png.flaticon.com/512/149/149071.png"
          }
          alt="avatar"
        />

        <input type="file" onChange={handleUpload} />

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