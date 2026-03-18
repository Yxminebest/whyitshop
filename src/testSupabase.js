import { supabase } from "./lib/supabase"

export async function testSupabase(){

  const { data, error } = await supabase
    .from("products")
    .select("*")

  if(error){
    console.log("❌ Supabase error:", error)
  }else{
    console.log("✅ Supabase connected:", data)
  }

}