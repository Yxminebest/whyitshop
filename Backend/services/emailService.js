import sgMail from '@sendgrid/mail';

// Initialize SendGrid
const apiKey = process.env.SENDGRID_API_KEY;
console.log('🔑 SendGrid API Key loaded:', apiKey ? `${apiKey.substring(0, 20)}...` : 'MISSING');
sgMail.setApiKey(apiKey);

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@whyitshop.com';
const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'WHY IT SHOP';

/**
 * 📧 Send generic email
 */
export const sendEmail = async (to, subject, htmlContent) => {
  try {
    console.log('📧 Sending email to:', to);
    const msg = {
      to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME
      },
      replyTo: {
        email: FROM_EMAIL,
        name: FROM_NAME
      },
      subject,
      html: htmlContent,
      // ✅ Anti-spam headers
      headers: {
        'X-Entity-Ref-ID': `whyitshop-${Date.now()}`
      },
      mailSettings: {
        sandboxMode: {
          enable: false
        }
      },
      trackingSettings: {
        clickTracking: {
          enable: false
        },
        openTracking: {
          enable: false
        },
        subscriptionTracking: {
          enable: false
        }
      }
    };

    const response = await sgMail.send(msg);
    console.log('✅ Email sent successfully:', to, 'Status:', response[0].statusCode);
    return response;
  } catch (error) {
    // ✅ แสดง error detail เต็มๆ
    console.error('❌ SendGrid Error:', error.message);
    if (error.response?.body?.errors) {
      error.response.body.errors.forEach((e, i) => {
        console.error(`  Error[${i}]:`, JSON.stringify(e));
      });
    }
    throw error;
  }
};

/**
 * 👋 Welcome Email (on Register)
 */
export const sendWelcomeEmail = async (email, firstName) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; margin: 20px 0; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to WHY IT SHOP!</h1>
          </div>
          <div class="content">
            <p>Hi ${firstName},</p>
            
            <p>Thank you for joining WHY IT SHOP! We're excited to have you as a member of our premium gaming equipment community.</p>
            
            <h3>What's Next?</h3>
            <ul>
              <li>🛍️ Browse our premium gaming products</li>
              <li>🎁 Get exclusive coupon codes</li>
              <li>📦 Fast and secure checkout</li>
              <li>🚚 Quick delivery across Thailand</li>
            </ul>
            
            <p><a href="https://whyitshop.com" class="button">Start Shopping Now</a></p>
            
            <p>If you have any questions, feel free to reply to this email or contact our support team.</p>
            
            <p>Happy gaming! 🎮</p>
            <p>- WHY IT SHOP Team</p>
          </div>
          <div class="footer">
            <p>WHY IT SHOP | Premium Gaming Equipment Store</p>
            <p>© 2026 All rights reserved</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail(email, '🎉 Welcome to WHY IT SHOP!', htmlContent);
};

/**
 * ✅ Order Confirmation Email (on Order Create)
 */
export const sendOrderConfirmationEmail = async (order, user, items) => {
  const itemsHTML = items
    .map(item => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px;">${item.name}</td>
        <td style="padding: 10px; text-align: right;">฿${item.price.toLocaleString()}</td>
        <td style="padding: 10px; text-align: center;">x ${item.quantity}</td>
        <td style="padding: 10px; text-align: right;">฿${(item.price * item.quantity).toLocaleString()}</td>
      </tr>
    `)
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .order-id { font-size: 24px; font-weight: bold; margin: 10px 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .total-row { background: #667eea; color: white; font-weight: bold; }
          .total-row td { padding: 15px; text-align: right; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; margin: 20px 0; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Order Confirmed!</h1>
            <p class="order-id">Order #${order.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <div class="content">
            <p>Hi ${user.firstName},</p>
            
            <p>Thank you for your order! We've received your payment and are preparing to ship your items.</p>
            
            <h3>Order Details:</h3>
            <table>
              <tr style="background: #667eea; color: white;">
                <th style="padding: 10px; text-align: left;">Product</th>
                <th style="padding: 10px; text-align: right;">Price</th>
                <th style="padding: 10px; text-align: center;">Qty</th>
                <th style="padding: 10px; text-align: right;">Total</th>
              </tr>
              ${itemsHTML}
              <tr class="total-row">
                <td colspan="3" style="text-align: right; padding: 15px;">Total Amount:</td>
                <td style="padding: 15px; text-align: right;">฿${order.total_price.toLocaleString()}</td>
              </tr>
            </table>
            
            <h3>📦 What Happens Next?</h3>
            <ol>
              <li><strong>Processing</strong> - We're preparing your order (1-2 hours)</li>
              <li><strong>Shipping</strong> - We'll send you a tracking number via email</li>
              <li><strong>Delivery</strong> - Expected delivery in 1-3 business days</li>
            </ol>
            
            <p><a href="https://whyitshop.com/my-orders/${order.id}" class="button">Track Your Order</a></p>
            
            <p style="margin: 20px 0; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
              <strong>ℹ️ Note:</strong> If you're purchasing with a bank slip, please wait for admin confirmation. Once verified, your order will move to "Paid" status.
            </p>
            
            <p>Thank you for shopping with WHY IT SHOP!</p>
            <p>- Our Team 🎮</p>
          </div>
          <div class="footer">
            <p>WHY IT SHOP | Premium Gaming Equipment Store</p>
            <p>© 2026 All rights reserved</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail(
    user.email,
    `✅ Order Confirmation #${order.id.slice(0, 8).toUpperCase()}`,
    htmlContent
  );
};

/**
 * 🔄 Order Status Update Email
 */
export const sendOrderStatusUpdateEmail = async (order, user, newStatus) => {
  const statusMessages = {
    pending: {
      icon: '⏳',
      title: 'Order Received',
      message: 'Your order has been received and is being processed.'
    },
    paid: {
      icon: '💳',
      title: 'Payment Confirmed',
      message: 'Payment has been verified. We\'re preparing your order for shipment.'
    },
    shipped: {
      icon: '📦',
      title: 'Order Shipped',
      message: 'Your order is on its way! Use the tracking number below to monitor your shipment.',
      tracking: true
    },
    completed: {
      icon: '🎉',
      title: 'Order Delivered',
      message: 'Your order has been delivered! Thank you for shopping with us.',
      review: true
    },
    cancelled: {
      icon: '❌',
      title: 'Order Cancelled',
      message: 'Your order has been cancelled. A refund will be processed shortly.'
    }
  };

  const status = statusMessages[newStatus] || statusMessages.pending;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .status-icon { font-size: 48px; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; margin: 20px 0; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
          .status-box { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="status-icon">${status.icon}</div>
            <h1>${status.title}</h1>
          </div>
          <div class="content">
            <p>Hi ${user.firstName},</p>
            
            <div class="status-box">
              <h3>Order #${order.id.slice(0, 8).toUpperCase()}</h3>
              <p><strong>Status:</strong> ${newStatus.toUpperCase()}</p>
              <p>${status.message}</p>
            </div>
            
            ${status.tracking ? `
              <h3>📍 Tracking Information:</h3>
              <p>Tracking number will be updated once shipped.</p>
              <p><a href="https://whyitshop.com/my-orders/${order.id}" class="button">View Tracking</a></p>
            ` : ''}
            
            ${status.review ? `
              <h3>⭐ Share Your Feedback</h3>
              <p>We'd love to hear about your experience! Please leave a review.</p>
              <p><a href="https://whyitshop.com/my-orders/${order.id}/review" class="button">Write Review</a></p>
            ` : ''}
            
            <p style="margin-top: 30px;">If you have any questions, don't hesitate to reach out to our support team.</p>
            <p>Thank you for your business!</p>
            <p>- WHY IT SHOP Team 🎮</p>
          </div>
          <div class="footer">
            <p>WHY IT SHOP | Premium Gaming Equipment Store</p>
            <p>© 2026 All rights reserved</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail(
    user.email,
    `${status.icon} ${status.title} - Order #${order.id.slice(0, 8).toUpperCase()}`,
    htmlContent
  );
};

/**
 * 🔐 Password Reset Email
 */
export const sendPasswordResetEmail = async (email, resetUrl) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; margin: 20px 0; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Reset Your Password</h1>
          </div>
          <div class="content">
            <p>We received a request to reset your WHY IT SHOP password. Click the button below to set a new password:</p>
            
            <p><a href="${resetUrl}" class="button">Reset Password</a></p>
            
            <p>This link will expire in 1 hour.</p>
            
            <div class="warning">
              <strong>⚠️ Safety Tip:</strong> If you didn't request a password reset, please ignore this email or contact support immediately.
            </div>
            
            <p>- WHY IT SHOP Team</p>
          </div>
          <div class="footer">
            <p>WHY IT SHOP | Premium Gaming Equipment Store</p>
            <p>© 2026 All rights reserved</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail(email, '🔐 Reset Your WHY IT SHOP Password', htmlContent);
};

export default {
  sendEmail,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendPasswordResetEmail
};
