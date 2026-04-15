import nodemailer from 'nodemailer';

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
          <title>Order Completed</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(to right, #6366f1, #f59e0b); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Order Completed! 🎉</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Dear ${orderData.customerName},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Great news! Your order <strong>#${orderData.orderId}</strong> has been completed and is ready for delivery.
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
              <p style="margin-top: 10px;">© ${new Date().getFullYear()} OrderFlow. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

        const mailOptions = {
            from: `"OrderFlow" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
            to: orderData.customerEmail,
            subject: `Order #${orderData.orderId} Completed - OrderFlow`,
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
