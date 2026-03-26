const API_URL = import.meta.env.VITE_API_URL;

export const getProducts = async () => {
  try {
    const res = await fetch(`${API_URL}/products`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return await res.json();
  } catch (error) {
    console.error("Error in getProducts:", error);
    throw error;
  }
};

export const addProduct = async (product) => {
  try {
    const res = await fetch(`${API_URL}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(product),
    });
    if (!res.ok) throw new Error('Failed to add product');
    return await res.json();
  } catch (error) {
    console.error("Error in addProduct:", error);
    throw error;
  }
};

export const deleteProduct = async (id) => {
  try {
    const res = await fetch(`${API_URL}/products/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error('Failed to delete product');
    return await res.json(); 
  } catch (error) {
    console.error("Error in deleteProduct:", error);
    throw error;
  }
};