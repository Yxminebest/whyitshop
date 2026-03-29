import { supabase } from "../lib/supabase";

/**
 * 🖼️ Upload payment slip with strict validation
 * - Only JPG/PNG (Bank slip usually in these formats)
 * - Max 5MB
 * - Sanitize filename
 */
export const uploadSlip = async (file, userId) => {
  if (!file) return null;

  try {
    // ✅ 1. Validate file type - STRICT (only JPG/PNG for bank slips)
    const validSlipTypes = ["image/jpeg", "image/png"];
    if (!validSlipTypes.includes(file.type)) {
      throw new Error("❌ สลิปต้องเป็นไฟล์ JPG หรือ PNG เท่านั้น");
    }

    // ✅ 2. Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error("❌ ไฟล์มีขนาดใหญ่เกิน 5MB");
    }

    // ✅ 3. Validate dimensions (basic check)
    // Bank slips are usually horizontal, so width >= height
    await validateImageDimensions(file);

    // ✅ 4. Create safe filename with userId for organization
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["jpg", "jpeg", "png"].includes(ext)) {
      throw new Error("❌ นามสกุลไฟล์ต้องเป็น .jpg หรือ .png");
    }

    const fileName = `slips/${userId}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
    
    // ✅ 5. Upload file to slips bucket
    const { data, error } = await supabase.storage
      .from("slips")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false
      });

    if (error) {
      console.error("Slip upload error:", error);
      if (error.message?.includes("404") || error.message?.includes("not found")) {
        throw new Error("❌ ต้องสร้างที่เก็บ 'slips' ใน Supabase Storage ก่อน");
      }
      throw new Error(`❌ อัปโหลดสลิปไม่สำเร็จ: ${error.message}`);
    }

    // ✅ 6. Get public URL
    const { data: publicData } = supabase.storage
      .from("slips")
      .getPublicUrl(fileName);

    const publicUrl = publicData.publicUrl;
    console.log("✅ Slip uploaded successfully:", publicUrl);
    
    return publicUrl;
  } catch (err) {
    console.error("Slip upload error:", err.message);
    throw err;
  }
};

/**
 * 🔍 Validate image dimensions (bank slip usually landscape)
 */
const validateImageDimensions = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Bank slips usually are landscape (width > height)
        // But allow both orientations
        if (img.width < 200 || img.height < 100) {
          reject(new Error("❌ รูปภาพขนาดเล็กเกินไป (ต้องอย่างน้อย 200x100 pixels)"));
        } else {
          resolve(true);
        }
      };
      img.onerror = () => {
        reject(new Error("❌ ไม่สามารถอ่านไฟล์รูปภาพได้"));
      };
      img.src = e.target.result;
    };
    reader.onerror = () => {
      reject(new Error("❌ เกิดข้อผิดพลาดในการอ่านไฟล์"));
    };
    reader.readAsDataURL(file);
  });
};

/**
 * 🗑️ Delete slip from storage
 */
export const deleteSlip = async (slipUrl) => {
  try {
    if (!slipUrl) return;
    
    // Extract filename from URL
    const fileName = slipUrl.split("/").pop();
    const filePath = `slips/${fileName}`;

    const { error } = await supabase.storage
      .from("slips")
      .remove([filePath]);

    if (error) {
      console.error("Delete slip error:", error);
    }
  } catch (err) {
    console.error("Delete slip error:", err);
  }
};
