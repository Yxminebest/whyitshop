import supabase from "../config/supabase.js";
import { sendWelcomeEmail } from "../services/emailService.js";
import { logAuthEvent } from "../middleware/auditLog.js";

/**
 * ✅ Handle user registration trigger
 * This is called from auth webhook or manually after user signup
 */
export const handleUserSignup = async (email, firstName = "", lastName = "") => {
  try {
    // Send welcome email
    await sendWelcomeEmail(email, firstName || email.split('@')[0]);
    console.log('✅ Welcome email sent to', email);
    
    return { success: true, message: 'Welcome email sent' };
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    // Don't fail the registration, just log the error
    return { success: false, message: error.message };
  }
};

export default {
  handleUserSignup
};
