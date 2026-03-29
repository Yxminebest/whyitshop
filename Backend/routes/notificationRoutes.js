import { Router } from 'express';
import supabase from '../config/supabase.js';
import { requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// ✅ Get all notifications for user
router.get('/', requireRole(), async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10, offset = 0 } = req.query;

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    // Get notifications with pagination
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      notifications,
      unreadCount: unreadCount || 0,
      total: unreadCount || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Mark notification as read
router.patch('/:id/read', requireRole(), async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;

    // Verify ownership
    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('user_id')
      .eq('id', notificationId)
      .single();

    if (fetchError || notification.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Mark as read
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;

    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Mark all notifications as read
router.patch('/read/all', requireRole(), async (req, res) => {
  try {
    const userId = req.user.id;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Delete notification
router.delete('/:id', requireRole(), async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;

    // Verify ownership
    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('user_id')
      .eq('id', notificationId)
      .single();

    if (fetchError || notification.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Delete
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Delete all notifications
router.delete('/clear/all', requireRole(), async (req, res) => {
  try {
    const userId = req.user.id;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ message: 'All notifications cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
