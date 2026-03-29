import supabase from "../config/supabase.js";
import { logAdminAction, logDataAccess } from "../middleware/auditLog.js";

// ✅ ดึงสินค้าของร้านตัวเอง (Store Owner)
export const getMyStoreProducts = async (req, res) => {
  try {
    const storeOwnerId = req.user.id;

    logDataAccess(req, "products", "read");

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("store_owner_id", storeOwnerId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ สร้างสินค้าใหม่ (Store Owner)
export const createStoreProduct = async (req, res) => {
  try {
    const { name, price, category, description, image } = req.body;
    const storeOwnerId = req.user.id;

    if (!name || !price || !category || !description) {
      return res.status(400).json({ error: "❌ Missing required fields" });
    }

    const { data, error } = await supabase
      .from("products")
      .insert([{
        name,
        price: Number(price),
        category,
        description,
        image: image || null,
        store_owner_id: storeOwnerId
      }])
      .select();

    if (error) throw error;

    logAdminAction(req, "CREATE_PRODUCT", data[0].id, { name, price });

    res.status(201).json({ 
      message: "✅ Product created successfully",
      data: data[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ อัปเดตสินค้า (Store Owner เฉพาะของตัวเอง)
export const updateStoreProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, category, description, image } = req.body;
    const storeOwnerId = req.user.id;

    // ตรวจสอบเจ้าของ
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !product) {
      return res.status(404).json({ error: "❌ Product not found" });
    }

    if (product.store_owner_id !== storeOwnerId) {
      return res.status(403).json({ error: "❌ You don't have permission to update this product" });
    }

    // สร้าง update object
    const updateData = {};
    if (name) updateData.name = name;
    if (price) updateData.price = Number(price);
    if (category) updateData.category = category;
    if (description) updateData.description = description;
    if (image) updateData.image = image;

    const { data, error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) throw error;

    logAdminAction(req, "UPDATE_PRODUCT", id, updateData);

    res.json({ 
      message: "✅ Product updated successfully",
      data: data[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ ลบสินค้า (Store Owner เฉพาะของตัวเอง)
export const deleteStoreProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const storeOwnerId = req.user.id;

    // ตรวจสอบเจ้าของ
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !product) {
      return res.status(404).json({ error: "❌ Product not found" });
    }

    if (product.store_owner_id !== storeOwnerId) {
      return res.status(403).json({ error: "❌ You don't have permission to delete this product" });
    }

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) throw error;

    logAdminAction(req, "DELETE_PRODUCT", id, {});

    res.json({ message: "✅ Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ ดึงออเดอร์ของร้านตัวเอง (Store Owner - เฉพาะออเดอร์ที่มีสินค้าของตัวเอง)
export const getMyStoreOrders = async (req, res) => {
  try {
    const storeOwnerId = req.user.id;

    logDataAccess(req, "orders", "read");

    // ดึงสินค้าของร้านตัวเอง
    const { data: myProducts, error: productsError } = await supabase
      .from("products")
      .select("id")
      .eq("store_owner_id", storeOwnerId);

    if (productsError) throw productsError;

    const productIds = myProducts.map(p => p.id);

    if (productIds.length === 0) {
      return res.json([]); // ไม่มีสินค้า = ไม่มีออเดอร์
    }

    // ดึงออเดอร์ที่มีสินค้าของร้านตัวเอง
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(`
        *,
        order_items!inner (*)
      `)
      .in("order_items.product_id", productIds)
      .order("created_at", { ascending: false });

    if (ordersError) throw ordersError;

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ ดึง Dashboard Stats ของร้าน (Store Owner)
export const getStoreStats = async (req, res) => {
  try {
    const storeOwnerId = req.user.id;

    // นับสินค้า
    const { data: products } = await supabase
      .from("products")
      .select("id")
      .eq("store_owner_id", storeOwnerId);

    // นับคูปอง
    const { data: coupons } = await supabase
      .from("coupons")
      .select("id")
      .eq("store_owner_id", storeOwnerId);

    // ดึงสินค้าของร้าน
    const { data: myProducts } = await supabase
      .from("products")
      .select("id")
      .eq("store_owner_id", storeOwnerId);

    const productIds = myProducts?.map(p => p.id) || [];

    // นับออเดอร์
    const { data: orders } = await supabase
      .from("orders")
      .select("id, status")
      .in("order_items.product_id", productIds.length > 0 ? productIds : ["null"]);

    const stats = {
      totalProducts: products?.length || 0,
      totalCoupons: coupons?.length || 0,
      totalOrders: orders?.length || 0,
      pendingOrders: orders?.filter(o => o.status === "pending").length || 0,
      completedOrders: orders?.filter(o => o.status === "completed").length || 0
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
