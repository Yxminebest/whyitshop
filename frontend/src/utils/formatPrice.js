/**
 * จัดรูปแบบตัวเลขให้มีลูกน้ำอัตโนมัติ
 * เช่น: 1000 → 1,000 | 1000000 → 1,000,000
 */
export const formatPrice = (value) => {
  if (!value) return "";
  // ลบอักขระที่ไม่ใช่ตัวเลข
  const numValue = value.toString().replace(/\D/g, "");
  // เพิ่มลูกน้ำ
  return numValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/**
 * เอาลูกน้ำออก เพื่อได้ตัวเลขจริง
 * เช่น: 1,000 → 1000
 */
export const removeComma = (value) => {
  return value.toString().replace(/,/g, "");
};
