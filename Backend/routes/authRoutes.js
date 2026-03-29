import { Router } from 'express';
import { sendWelcomeEmail, sendOrderConfirmationEmail, sendOrderStatusUpdateEmail } from '../services/emailService.js';
import supabase from '../config/supabase.js';

const router = Router();

/**
 * 🚀 POST /api/auth/register
 * ระบบสมัครสมาชิกผ่าน Supabase Auth
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // 1. ตรวจสอบข้อมูลเบื้องต้น
    if (!email || !password || !firstName) {
      return res.status(400).json({ error: '❌ โปรดกรอกอีเมล รหัสผ่าน และชื่อให้ครบถ้วน' });
    }
    if (password.length < 6) { // Supabase กำหนดขั้นต่ำที่ 6 ตัว
      return res.status(400).json({ error: '❌ รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
    }

    // 2. ใช้ Supabase Auth ในการสร้างบัญชี
    // ฟังก์ชันนี้จะจัดการเข้ารหัสผ่าน และสร้างบัญชีใน auth.users ให้อัตโนมัติ
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          firstname: firstName, // ชื่อต้องตรงกับตัวแปรที่คุณจะใช้
          lastname: lastName || '',
        }
      }
    });

    if (authError) {
      console.error('Supabase SignUp Error:', authError.message);
      // ดักจับ Error กรณีอีเมลซ้ำ
      if (authError.status === 422) {
         return res.status(409).json({ error: '❌ อีเมลนี้ถูกใช้งานแล้ว หรือรูปแบบอีเมลไม่ถูกต้อง' });
      }
      return res.status(500).json({ error: '❌ ไม่สามารถสร้างบัญชีได้ในขณะนี้: ' + authError.message });
    }

    // 3. (ทางเลือก) ถ้าคุณไม่มี Database Trigger ให้ insert ลง public.users ด้วยตัวเอง
    // โดยใช้ ID ที่ได้จากการสมัครสมาชิกมาเชื่อมโยงกัน
    const { error: insertError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id, // ใช้ ID จาก auth.users
          email: email,
          firstname: firstName, // ✅ แก้ให้ตรงกับชื่อ Column ในภาพ (ไม่มี underscore)
          lastname: lastName || '', // ✅ แก้ให้ตรงกับชื่อ Column ในภาพ
          role: 'customer'
        }
      ]);

    if (insertError) {
      console.error('Public Users Insert Error:', insertError);
      // อนุโลมให้ผ่านไปได้ เพราะบัญชีหลักสร้างเสร็จแล้ว
    }

    // 4. สั่งส่งอีเมลต้อนรับ (Background Task)
    sendWelcomeEmail(email, firstName).catch(err => {
      console.error('Background Email Error:', err);
    });

    res.status(201).json({ 
      message: '✅ สมัครสมาชิกสำเร็จ!', 
      user: {
        id: authData.user.id,
        email: email,
        firstname: firstName
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * 🔐 POST /api/auth/login
 * ระบบเข้าสู่ระบบผ่าน Supabase Auth
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '❌ โปรดกรอกอีเมลและรหัสผ่าน' });
    }

    // 1. ใช้ Supabase Auth ในการล็อคอิน
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (loginError) {
      console.error('Supabase Login Error:', loginError.message);
      return res.status(401).json({ error: '❌ อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    // 2. ดึงข้อมูล Profile เพิ่มเติมจาก public.users (ถ้าต้องการ)
    const { data: userProfile } = await supabase
      .from('users')
      .select('firstname, lastname, role, avatar')
      .eq('id', loginData.user.id)
      .single();

    res.json({ 
      message: '✅ เข้าสู่ระบบสำเร็จ', 
      user: {
        id: loginData.user.id,
        email: loginData.user.email,
        ...userProfile
      },
      // ส่ง Token กลับไปให้ Frontend ใช้ยืนยันตัวตนใน API อื่นๆ
      accessToken: loginData.session.access_token 
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==========================================
// 📧 API สำหรับส่งอีเมลโดยเฉพาะ (จากโค้ดเดิมของคุณ)
// ==========================================

router.post('/send-welcome-email', async (req, res) => {
  try {
    const { email, firstName } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    await sendWelcomeEmail(email, firstName || 'Friend');
    res.json({ message: 'Welcome email sent' });
  } catch (error) {
    console.error('Send welcome email error:', error);
    res.json({ message: 'Email queued (may fail silently)' });
  }
});

router.post('/send-order-confirmation', async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: 'Order ID required' });

    const { data: order, error: orderError } = await supabase.from('orders').select('*').eq('id', orderId).single();
    if (orderError || !order) return res.status(404).json({ error: 'Order not found' });

    const { data: user, error: userError } = await supabase.from('users').select('*').eq('id', order.user_id).single();
    if (userError || !user) return res.status(404).json({ error: 'User not found' });

    const { data: items, error: itemsError } = await supabase.from('order_items').select('*').eq('order_id', orderId);
    if (itemsError) return res.status(500).json({ error: 'Failed to fetch order items' });

    await sendOrderConfirmationEmail(order, user, items || []);
    res.json({ message: 'Order confirmation email sent' });
  } catch (error) {
    console.error('Send order confirmation error:', error);
    res.json({ message: 'Email queued (may fail silently)' });
  }
});

router.post('/send-status-update', async (req, res) => {
  try {
    const { orderId, newStatus } = req.body;
    if (!orderId || !newStatus) return res.status(400).json({ error: 'Order ID and status required' });

    const { data: order, error: orderError } = await supabase.from('orders').select('*').eq('id', orderId).single();
    if (orderError || !order) return res.status(404).json({ error: 'Order not found' });

    const { data: user, error: userError } = await supabase.from('users').select('*').eq('id', order.user_id).single();
    if (userError || !user) return res.status(404).json({ error: 'User not found' });

    // ✅ normalize field names (DB ใช้ firstname ตัวเล็ก)
    const normalizedUser = {
      ...user,
      firstName: user.firstname || user.firstName || 'Customer',
      email: user.email
    };

    await sendOrderStatusUpdateEmail(order, normalizedUser, newStatus);
    res.json({ message: 'Status update email sent' });
  } catch (error) {
    console.error('Send status update error:', error);
    res.json({ message: 'Email queued (may fail silently)' });
  }
});

export default router;