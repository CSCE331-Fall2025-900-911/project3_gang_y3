import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Create Gmail transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

type OrderItem = {
  name: string;
  price: number;
  quantity: number;
  custom?: {
    temperature?: string;
    ice?: string;
    sugar?: string;
    toppings?: number[];
  };
};

export async function POST(request: Request) {
  try {
    const { email, orderId, items, total } = await request.json();

    if (!email || !orderId) {
      return NextResponse.json({ error: 'Email and order ID are required' }, { status: 400 });
    }

    // Use passed items and total
    const orderItems: OrderItem[] = items;
    const orderTotal = total;

    // Build the receipt HTML
    const itemsHtml = orderItems.map((item: OrderItem) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name} ${item.custom ? `<br><small style="color:#666;">${item.custom.temperature || ''} ${item.custom.ice ? '| Ice: ' + item.custom.ice : ''} ${item.custom.sugar ? '| Sugar: ' + item.custom.sugar : ''}</small>` : ''}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
      <h2>ShareTea Receipt</h2>
      <p><strong>Order #${orderId}</strong><br>
      ${new Date().toLocaleString()}</p>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="background: #f5f5f5;">
          <th style="padding: 8px; text-align: left;">Item</th>
          <th style="padding: 8px; text-align: center;">Qty</th>
          <th style="padding: 8px; text-align: right;">Price</th>
        </tr>
        ${itemsHtml}
        <tr>
          <td colspan="2" style="padding: 10px; font-weight: bold;">Total</td>
          <td style="padding: 10px; font-weight: bold; text-align: right;">$${orderTotal.toFixed(2)}</td>
        </tr>
      </table>
      
      <p style="margin-top: 20px;">Thank you for your order!</p>
    </body>
    </html>
    `;

    // Send the email
    await transporter.sendMail({
      from: `"ShareTea" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Your ShareTea Receipt - Order #${orderId}`,
      html: emailHtml,
    });

    return NextResponse.json({ success: true, message: 'Receipt sent successfully' });

  } catch (error) {
    console.error('Error sending receipt:', error);
    return NextResponse.json({ error: 'Failed to send receipt' }, { status: 500 });
  }
}
