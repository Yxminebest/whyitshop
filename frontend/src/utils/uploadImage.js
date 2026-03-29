import { supabase } from "../lib/supabase";

export const uploadImage = async (file) => {
  if (!file) return null;

  try {
    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      throw new Error("รูปแบบไฟล์ไม่รองรับ (JPG, PNG, GIF, WebP เท่านั้น)");
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error("ไฟล์มีขนาดใหญ่เกิน 5MB");
    }

    // Create safe filename - remove all special characters and spaces
    const ext = file.name.split(".").pop().toLowerCase();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
    
    // Upload file
    const { data, error } = await supabase.storage
      .from("product-images")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false
      });

    if (error) {
      console.error("Upload error:", error);
      // Check if bucket doesn't exist
      if (error.message?.includes("404") || error.message?.includes("not found")) {
        throw new Error("ต้องสร้างที่เก็บรูป product-images ใน Supabase Storage ก่อน");
      }
      throw new Error(`อัปโหลดรูปไม่สำเร็จ: ${error.message}`);
    }

    // Get public URL
    const { data: publicData } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);

    const publicUrl = publicData.publicUrl;
    console.log("✅ Image uploaded successfully:", publicUrl);
    
    return publicUrl;
  } catch (err) {
    console.error("Image upload error:", err);
    throw err;
  }
};

export const deleteImage = async (fileName) => {
  try {
    if (!fileName) return;
    
    const { error } = await supabase.storage
      .from("product-images")
      .remove([fileName]);

    if (error && !error.message?.includes("404")) {
      console.error("Delete error:", error);
    }
  } catch (err) {
    console.error("Image delete error:", err);
  }
};
