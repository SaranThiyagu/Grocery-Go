import nodemailer from 'nodemailer';
import { formatDeliveryDate, formatDeliverySlot } from '@/lib/delivery';

interface OrderEmailData {
    orderId: string;
    customerName: string;
    customerEmail: string;
    totalAmount: number;
    items: Array<{
        productName: string;
        quantity: number;
        price: number;
    }>;
}

interface OrderConfirmedEmailData {
    orderId: string;
    customerName: string;
    customerEmail: string;
    deliveryDate: string | null;
    deliverySlot: string | null;
}

interface DeliveryRescheduledEmailData {
    orderId: string;
    customerName: string;
    customerEmail: string;
    deliveryDate: string | null;
    deliverySlot: string | null;
    reason: string;
}

// Create reusable transporter
const createTransporter = () => {
    // For development, you can use a test account from Ethereal
    // For production, use your actual SMTP credentials
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
    });
};

export async function sendOrderCompletionEmail(orderData: OrderEmailData) {
    try {
        const transporter = createTransporter();

        // Calculate total
        const itemsHtml = orderData.items
            .map(
                (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.productName}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${item.price.toFixed(2)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
      `
            )
            .join('');

        const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Delivered</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(to right, #6366f1, #f59e0b); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Order Delivered! 🎉</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Dear ${orderData.customerName},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Great news! Your order <strong>#${orderData.orderId}</strong> has been delivered.
            </p>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #1f2937; font-size: 20px; margin-top: 0;">Order Summary</h2>
              
              <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <thead>
                  <tr style="background: #f3f4f6;">
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Product</th>
                    <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" style="padding: 15px; text-align: right; font-weight: bold; font-size: 18px;">Total Amount:</td>
                    <td style="padding: 15px; text-align: right; font-weight: bold; font-size: 18px; color: #10b981;">₹${orderData.totalAmount.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <p style="font-size: 16px; margin-top: 20px;">
              Thank you for your order! If you have any questions, please don't hesitate to contact us.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
              <p>This is an automated email. Please do not reply to this message.</p>
              <p style="margin-top: 10px;">© ${new Date().getFullYear()} Grocery-Go. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

        const mailOptions = {
            from: `"Grocery-Go" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
            to: orderData.customerEmail,
            subject: `Order #${orderData.orderId} Delivered - Grocery-Go`,
            html: emailHtml,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error };
    }
}

export async function sendOrderConfirmedEmail(data: OrderConfirmedEmailData) {
    try {
        const transporter = createTransporter();
        const dateText = data.deliveryDate ? formatDeliveryDate(data.deliveryDate) : 'TBD';
        const slotText = data.deliverySlot ? formatDeliverySlot(data.deliverySlot) : '';

        const emailHtml = `
        <!DOCTYPE html>
        <html><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(to right, #2563eb, #1d4ed8); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 26px;">Order Confirmed! ✅</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Dear ${data.customerName},</p>
            <p style="font-size: 16px;">Your order <strong>#${data.orderId}</strong> has been confirmed by our team.</p>
            <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
              <h2 style="margin: 0 0 8px 0; font-size: 18px; color: #1e3a8a;">Scheduled Delivery</h2>
              <p style="margin: 0; font-size: 16px;"><strong>Date:</strong> ${dateText}</p>
              ${slotText ? `<p style="margin: 4px 0 0 0; font-size: 16px;"><strong>Slot:</strong> ${slotText}</p>` : ''}
            </div>
            <p style="font-size: 14px; color: #6b7280;">We'll notify you again once the order is out for delivery.</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Grocery-Go. All rights reserved.</p>
            </div>
          </div>
        </body></html>`;

        const info = await transporter.sendMail({
            from: `"Grocery-Go" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
            to: data.customerEmail,
            subject: `Order #${data.orderId} Confirmed - Delivery on ${dateText}`,
            html: emailHtml,
        });
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending confirmation email:', error);
        return { success: false, error };
    }
}

export async function sendDeliveryRescheduledEmail(data: DeliveryRescheduledEmailData) {
    try {
        const transporter = createTransporter();
        const dateText = data.deliveryDate ? formatDeliveryDate(data.deliveryDate) : 'TBD';
        const slotText = data.deliverySlot ? formatDeliverySlot(data.deliverySlot) : '';

        const emailHtml = `
        <!DOCTYPE html>
        <html><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(to right, #f59e0b, #d97706); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 26px;">Delivery Rescheduled 🔄</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Dear ${data.customerName},</p>
            <p style="font-size: 16px;">The delivery for your order <strong>#${data.orderId}</strong> has been rescheduled.</p>
            <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; font-size: 16px;"><strong>New date:</strong> ${dateText}</p>
              ${slotText ? `<p style="margin: 4px 0 0 0; font-size: 16px;"><strong>Slot:</strong> ${slotText}</p>` : ''}
              ${data.reason ? `<p style="margin: 12px 0 0 0; font-size: 14px; color: #92400e;"><strong>Reason:</strong> ${data.reason}</p>` : ''}
            </div>
            <p style="font-size: 14px; color: #6b7280;">We apologise for any inconvenience caused.</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Grocery-Go. All rights reserved.</p>
            </div>
          </div>
        </body></html>`;

        const info = await transporter.sendMail({
            from: `"Grocery-Go" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
            to: data.customerEmail,
            subject: `Order #${data.orderId} Delivery Rescheduled to ${dateText}`,
            html: emailHtml,
        });
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending reschedule email:', error);
        return { success: false, error };
    }
}

