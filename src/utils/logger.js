import { supabase } from "../lib/supabase";

export const logAction = async (action, detail = "") => {
  try {
    const { data } = await supabase.auth.getUser();
    const user = data?.user;

    if (!user) return;

    await supabase.from("logs").insert([
      {
        user_id: user.id,
        action,
        detail,
      }
    ]);

  } catch (err) {
    console.error("Log error:", err);
  }
};