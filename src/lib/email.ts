/**
 * src/lib/email.ts
 *
 * Transactional email service using Nodemailer and Gmail SMTP.
 * Sends order placement receipts, payment confirmations, and admin acceptance alerts to customers.
 */

import nodemailer from 'nodemailer';

export interface OrderEmailItem {
  name: string;
  variantName?: string | null;
  quantity: number;
  lineTotal: string | number;
}

export interface OrderEmailPayload {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  tableNumber?: string | null;
  items: OrderEmailItem[];
  subtotal: string | number;
  taxAmount?: string | number;
  total: string | number;
  paymentId?: string | null;
  paymentMethod?: string;
  paymentUrl?: string | null;
}

function getMailTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn('[EmailService] SMTP_USER or SMTP_PASS not set. Skipping email dispatch.');
    return null;
  }

  // Use service: 'gmail' for optimal Gmail connectivity & pooling
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
  });
}

function renderItemsHtml(items: OrderEmailItem[]): string {
  return items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f0e6dc; font-size: 14px; color: #241512;">
          <strong>${item.name}</strong>${item.variantName ? ` <span style="color: #7B1D1D; font-size: 12px;">(${item.variantName})</span>` : ''}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f0e6dc; font-size: 14px; color: #241512; text-align: center;">
          ×${item.quantity}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f0e6dc; font-size: 14px; color: #241512; text-align: right; font-weight: 600;">
          ₹${Number(item.lineTotal).toFixed(2)}
        </td>
      </tr>`
    )
    .join('');
}

/**
 * 1. Send Order Received Email (Immediately upon placing order)
 */
export async function sendOrderReceivedEmail(payload: OrderEmailPayload) {
  try {
    const transporter = getMailTransporter();
    if (!transporter) return { success: false, reason: 'SMTP not configured' };

    const itemsHtml = renderItemsHtml(payload.items);

    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Order Received - Shree Kripa</title></head>
    <body style="margin: 0; padding: 24px 0; background-color: #fbf7f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td align="center">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #ebdcd0; max-width: 92%;">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #7B1D1D 0%, #521212 100%); padding: 32px 24px; text-align: center;">
                  <h1 style="color: #FFF8F0; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.5px;">SHREE KRIPA</h1>
                  <p style="color: #C9A84C; margin: 6px 0 0 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px;">Family Restaurant & Banquet • Varanasi</p>
                </td>
              </tr>

              <!-- Status Banner -->
              <tr>
                <td style="padding: 24px 28px 12px 28px; text-align: center;">
                  <div style="display: inline-block; background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 50px; padding: 8px 18px; margin-bottom: 12px;">
                    <span style="color: #92400e; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;">⏳ Order Placed • Sent to Kitchen</span>
                  </div>
                  <h2 style="color: #241512; font-size: 20px; margin: 8px 0 4px 0;">Namaste, ${payload.customerName}!</h2>
                  <p style="color: #6b5c58; font-size: 14px; margin: 0; line-height: 1.5;">
                    We have successfully received your order. Our team will verify and begin preparing your food fresh.
                  </p>
                </td>
              </tr>

              <!-- Order Summary Meta -->
              <tr>
                <td style="padding: 12px 28px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fdfaf7; border-radius: 12px; padding: 16px; border: 1px solid #f0e6dc;">
                    <tr>
                      <td style="font-size: 13px; color: #6b5c58; padding: 4px 0;">Order Number:</td>
                      <td style="font-size: 14px; color: #7B1D1D; font-weight: 700; text-align: right; font-family: monospace;">${payload.orderNumber}</td>
                    </tr>
                    ${
                      payload.tableNumber
                        ? `<tr>
                      <td style="font-size: 13px; color: #6b5c58; padding: 4px 0;">Dining Table:</td>
                      <td style="font-size: 14px; color: #241512; font-weight: 700; text-align: right;">Table ${payload.tableNumber}</td>
                    </tr>`
                        : ''
                    }
                    <tr>
                      <td style="font-size: 13px; color: #6b5c58; padding: 4px 0;">Payment Method:</td>
                      <td style="font-size: 13px; color: #241512; font-weight: 600; text-align: right;">${payload.paymentMethod || 'Cash at Counter / Online'}</td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Items Table -->
              <tr>
                <td style="padding: 16px 28px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                    <thead>
                      <tr style="background-color: #f7ede3;">
                        <th style="padding: 10px 12px; font-size: 12px; text-align: left; color: #521212; text-transform: uppercase;">Dish / Item</th>
                        <th style="padding: 10px 12px; font-size: 12px; text-align: center; color: #521212; text-transform: uppercase;">Qty</th>
                        <th style="padding: 10px 12px; font-size: 12px; text-align: right; color: #521212; text-transform: uppercase;">Price</th>
                      </tr>
                    </thead>
                    <tbody>${itemsHtml}</tbody>
                  </table>
                  ${
                    payload.paymentUrl
                      ? `
                  <!-- Payment Link CTA -->
                  <div style="margin-top: 24px; background-color: #fdfaf7; border: 2px dashed #C9A84C; border-radius: 14px; padding: 20px 16px; text-align: center;">
                    <p style="margin: 0 0 10px 0; font-size: 13px; font-weight: 700; color: #7B1D1D; text-transform: uppercase; letter-spacing: 0.5px;">
                      Complete Online Payment to Start Preparation
                    </p>
                    <a href="${payload.paymentUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #7B1D1D 0%, #521212 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 700; font-size: 15px; border: 2px solid #C9A84C; box-shadow: 0 4px 14px rgba(123, 29, 29, 0.25);">
                      💳 Click to Pay Online (₹${Number(payload.total).toFixed(2)})
                    </a>
                    <p style="margin: 10px 0 0 0; font-size: 11px; color: #6b5c58;">
                      Pay securely via UPI (GPay, PhonePe, Paytm), Credit/Debit Card, or NetBanking.<br/>
                      Once payment is completed, the kitchen will immediately begin preparing your meal.
                    </p>
                  </div>`
                      : ''
                  }
                </td>
              </tr>

              <!-- Totals -->
              <tr>
                <td style="padding: 0 28px 24px 28px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top: 2px solid #7B1D1D; padding-top: 12px;">
                    <tr>
                      <td style="font-size: 14px; color: #6b5c58; padding: 4px 0;">Subtotal:</td>
                      <td style="font-size: 14px; color: #241512; font-weight: 600; text-align: right;">₹${Number(payload.subtotal).toFixed(2)}</td>
                    </tr>
                    ${
                      payload.taxAmount && Number(payload.taxAmount) > 0
                        ? `<tr>
                      <td style="font-size: 14px; color: #6b5c58; padding: 4px 0;">Taxes (GST):</td>
                      <td style="font-size: 14px; color: #241512; font-weight: 600; text-align: right;">₹${Number(payload.taxAmount).toFixed(2)}</td>
                    </tr>`
                        : ''
                    }
                    <tr>
                      <td style="font-size: 16px; color: #7B1D1D; font-weight: 800; padding: 8px 0 0 0;">Total Payable:</td>
                      <td style="font-size: 18px; color: #7B1D1D; font-weight: 800; text-align: right; padding: 8px 0 0 0;">₹${Number(payload.total).toFixed(2)}</td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #241512; padding: 24px; text-align: center; color: #FFF8F0;">
                  <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #C9A84C;">Shree Kripa Family Restaurant & Banquet</p>
                  <p style="margin: 0; font-size: 12px; color: #ebdcd0; line-height: 1.4;">
                    Akhari Bypass, Near Toll Plaza, Varanasi, Uttar Pradesh<br/>
                    Phone: +91 9415268463 • Web: https://shri-kripa.vercel.app
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>`;

    const info = await transporter.sendMail({
      from: `"Shree Kripa Restaurant" <${process.env.SMTP_USER}>`,
      to: payload.customerEmail,
      subject: `Order Received #${payload.orderNumber} - Shree Kripa`,
      html,
    });

    console.log('[EmailService] Order received email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[EmailService] Failed to send order received email:', err);
    return { success: false, error: err };
  }
}

/**
 * 2. Send Payment Received & Order Receipt Email to Customer (Upon Razorpay payment success)
 */
export async function sendOrderPaymentSuccessEmail(payload: OrderEmailPayload) {
  try {
    const transporter = getMailTransporter();
    if (!transporter) return { success: false, reason: 'SMTP not configured' };

    const itemsHtml = renderItemsHtml(payload.items);

    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Payment Receipt - Shree Kripa</title></head>
    <body style="margin: 0; padding: 24px 0; background-color: #fbf7f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td align="center">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #ebdcd0; max-width: 92%;">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #7B1D1D 0%, #521212 100%); padding: 32px 24px; text-align: center;">
                  <h1 style="color: #FFF8F0; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.5px;">SHREE KRIPA</h1>
                  <p style="color: #C9A84C; margin: 6px 0 0 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px;">Family Restaurant & Banquet • Varanasi</p>
                </td>
              </tr>

              <!-- Status Banner -->
              <tr>
                <td style="padding: 24px 28px 12px 28px; text-align: center;">
                  <div style="display: inline-block; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 50px; padding: 8px 18px; margin-bottom: 12px;">
                    <span style="color: #065f46; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;">✓ Payment Received • Order Placed</span>
                  </div>
                  <h2 style="color: #241512; font-size: 20px; margin: 8px 0 4px 0;">Thank you, ${payload.customerName}!</h2>
                  <p style="color: #6b5c58; font-size: 14px; margin: 0; line-height: 1.5;">
                    Your online payment was completed successfully. Our chefs have received your order and are preparing your meal fresh.
                  </p>
                </td>
              </tr>

              <!-- Order Summary Meta -->
              <tr>
                <td style="padding: 12px 28px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fdfaf7; border-radius: 12px; padding: 16px; border: 1px solid #f0e6dc;">
                    <tr>
                      <td style="font-size: 13px; color: #6b5c58; padding: 4px 0;">Order Number:</td>
                      <td style="font-size: 14px; color: #7B1D1D; font-weight: 700; text-align: right; font-family: monospace;">${payload.orderNumber}</td>
                    </tr>
                    ${
                      payload.tableNumber
                        ? `<tr>
                      <td style="font-size: 13px; color: #6b5c58; padding: 4px 0;">Dining Table:</td>
                      <td style="font-size: 14px; color: #241512; font-weight: 700; text-align: right;">Table ${payload.tableNumber}</td>
                    </tr>`
                        : ''
                    }
                    ${
                      payload.paymentId
                        ? `<tr>
                      <td style="font-size: 13px; color: #6b5c58; padding: 4px 0;">Razorpay Payment ID:</td>
                      <td style="font-size: 13px; color: #241512; font-weight: 600; text-align: right; font-family: monospace;">${payload.paymentId}</td>
                    </tr>`
                        : ''
                    }
                  </table>
                </td>
              </tr>

              <!-- Items Table -->
              <tr>
                <td style="padding: 16px 28px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                    <thead>
                      <tr style="background-color: #f7ede3;">
                        <th style="padding: 10px 12px; font-size: 12px; text-align: left; color: #521212; text-transform: uppercase;">Dish / Item</th>
                        <th style="padding: 10px 12px; font-size: 12px; text-align: center; color: #521212; text-transform: uppercase;">Qty</th>
                        <th style="padding: 10px 12px; font-size: 12px; text-align: right; color: #521212; text-transform: uppercase;">Price</th>
                      </tr>
                    </thead>
                    <tbody>${itemsHtml}</tbody>
                  </table>
                </td>
              </tr>

              <!-- Totals -->
              <tr>
                <td style="padding: 0 28px 24px 28px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top: 2px solid #7B1D1D; padding-top: 12px;">
                    <tr>
                      <td style="font-size: 14px; color: #6b5c58; padding: 4px 0;">Subtotal:</td>
                      <td style="font-size: 14px; color: #241512; font-weight: 600; text-align: right;">₹${Number(payload.subtotal).toFixed(2)}</td>
                    </tr>
                    ${
                      payload.taxAmount && Number(payload.taxAmount) > 0
                        ? `<tr>
                      <td style="font-size: 14px; color: #6b5c58; padding: 4px 0;">Taxes (GST):</td>
                      <td style="font-size: 14px; color: #241512; font-weight: 600; text-align: right;">₹${Number(payload.taxAmount).toFixed(2)}</td>
                    </tr>`
                        : ''
                    }
                    <tr>
                      <td style="font-size: 16px; color: #7B1D1D; font-weight: 800; padding: 8px 0 0 0;">Total Paid:</td>
                      <td style="font-size: 18px; color: #7B1D1D; font-weight: 800; text-align: right; padding: 8px 0 0 0;">₹${Number(payload.total).toFixed(2)}</td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #241512; padding: 24px; text-align: center; color: #FFF8F0;">
                  <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #C9A84C;">Shree Kripa Family Restaurant & Banquet</p>
                  <p style="margin: 0; font-size: 12px; color: #ebdcd0; line-height: 1.4;">
                    Akhari Bypass, Near Toll Plaza, Varanasi, Uttar Pradesh<br/>
                    Phone: +91 9415268463 • Web: https://shri-kripa.vercel.app
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>`;

    const info = await transporter.sendMail({
      from: `"Shree Kripa Restaurant" <${process.env.SMTP_USER}>`,
      to: payload.customerEmail,
      subject: `Payment Received & Order Confirmed #${payload.orderNumber} - Shree Kripa`,
      html,
    });

    console.log('[EmailService] Payment receipt sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[EmailService] Failed to send payment receipt email:', err);
    return { success: false, error: err };
  }
}

/**
 * 3. Send "Order Confirmed by Staff" Email to Customer when Admin/Staff updates order to ACCEPTED
 */
export async function sendOrderConfirmedByStaffEmail(payload: OrderEmailPayload) {
  try {
    const transporter = getMailTransporter();
    if (!transporter) return { success: false, reason: 'SMTP not configured' };

    const itemsHtml = renderItemsHtml(payload.items);

    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Order Confirmed - Shree Kripa</title></head>
    <body style="margin: 0; padding: 24px 0; background-color: #fbf7f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td align="center">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #ebdcd0; max-width: 92%;">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #7B1D1D 0%, #521212 100%); padding: 32px 24px; text-align: center;">
                  <h1 style="color: #FFF8F0; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.5px;">SHREE KRIPA</h1>
                  <p style="color: #C9A84C; margin: 6px 0 0 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px;">Family Restaurant & Banquet • Varanasi</p>
                </td>
              </tr>

              <!-- Status Banner -->
              <tr>
                <td style="padding: 24px 28px 12px 28px; text-align: center;">
                  <div style="display: inline-block; background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 50px; padding: 8px 18px; margin-bottom: 12px;">
                    <span style="color: #92400e; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;">★ Order Accepted & Confirmed</span>
                  </div>
                  <h2 style="color: #241512; font-size: 20px; margin: 8px 0 4px 0;">Hello, ${payload.customerName}!</h2>
                  <p style="color: #6b5c58; font-size: 14px; margin: 0; line-height: 1.5;">
                    Your order has been officially confirmed by our restaurant manager. The kitchen is preparing your dishes fresh with utmost care.
                  </p>
                </td>
              </tr>

              <!-- Order Summary Meta -->
              <tr>
                <td style="padding: 12px 28px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fdfaf7; border-radius: 12px; padding: 16px; border: 1px solid #f0e6dc;">
                    <tr>
                      <td style="font-size: 13px; color: #6b5c58; padding: 4px 0;">Order Number:</td>
                      <td style="font-size: 14px; color: #7B1D1D; font-weight: 700; text-align: right; font-family: monospace;">${payload.orderNumber}</td>
                    </tr>
                    ${
                      payload.tableNumber
                        ? `<tr>
                      <td style="font-size: 13px; color: #6b5c58; padding: 4px 0;">Dining Table:</td>
                      <td style="font-size: 14px; color: #241512; font-weight: 700; text-align: right;">Table ${payload.tableNumber}</td>
                    </tr>`
                        : ''
                    }
                    <tr>
                      <td style="font-size: 13px; color: #6b5c58; padding: 4px 0;">Total Payable / Paid:</td>
                      <td style="font-size: 15px; color: #7B1D1D; font-weight: 700; text-align: right;">₹${Number(payload.total).toFixed(2)}</td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Items Table -->
              <tr>
                <td style="padding: 16px 28px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                    <thead>
                      <tr style="background-color: #f7ede3;">
                        <th style="padding: 8px 12px; font-size: 12px; text-align: left; color: #521212; text-transform: uppercase;">Dish</th>
                        <th style="padding: 8px 12px; font-size: 12px; text-align: center; color: #521212; text-transform: uppercase;">Qty</th>
                        <th style="padding: 8px 12px; font-size: 12px; text-align: right; color: #521212; text-transform: uppercase;">Total</th>
                      </tr>
                    </thead>
                    <tbody>${itemsHtml}</tbody>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #241512; padding: 24px; text-align: center; color: #FFF8F0;">
                  <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #C9A84C;">Shree Kripa Family Restaurant & Banquet</p>
                  <p style="margin: 0; font-size: 12px; color: #ebdcd0; line-height: 1.4;">
                    Akhari Bypass, Near Toll Plaza, Varanasi, Uttar Pradesh<br/>
                    Phone: +91 9415268463 • Web: https://shri-kripa.vercel.app
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>`;

    const info = await transporter.sendMail({
      from: `"Shree Kripa Restaurant" <${process.env.SMTP_USER}>`,
      to: payload.customerEmail,
      subject: `Your Order is Confirmed #${payload.orderNumber} - Shree Kripa`,
      html,
    });

    console.log('[EmailService] Order confirmed email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[EmailService] Failed to send order confirmed email:', err);
    return { success: false, error: err };
  }
}

export interface BookingEmailPayload {
  bookingReference: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  bookingDate: string;
  timeSlot: string;
  guestCount: number;
  tableNumber?: string | null;
  specialRequest?: string | null;
  isConfirmed?: boolean;
  paymentUrl?: string | null;
  preOrder?: {
    orderNumber: string;
    total: string | number;
    items: { name: string; quantity: number; lineTotal: string | number }[];
  };
}

/**
 * 4. Send Table Booking Confirmation / Receipt Email to Customer
 */
export async function sendTableBookingEmail(payload: BookingEmailPayload) {
  try {
    const transporter = getMailTransporter();
    if (!transporter) return { success: false, reason: 'SMTP not configured' };

    const statusTitle = payload.isConfirmed ? 'Reservation Confirmed' : 'Table Booking Request Received';
    const statusBadge = payload.isConfirmed ? '✓ Table Confirmed' : '⏳ Booking Received';
    const badgeColor = payload.isConfirmed ? '#065f46' : '#92400e';
    const badgeBg = payload.isConfirmed ? '#ecfdf5' : '#fef3c7';
    const badgeBorder = payload.isConfirmed ? '#a7f3d0' : '#fde68a';

    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>${statusTitle} - Shree Kripa</title></head>
    <body style="margin: 0; padding: 24px 0; background-color: #fbf7f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td align="center">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #ebdcd0; max-width: 92%;">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #7B1D1D 0%, #521212 100%); padding: 32px 24px; text-align: center;">
                  <h1 style="color: #FFF8F0; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.5px;">SHREE KRIPA</h1>
                  <p style="color: #C9A84C; margin: 6px 0 0 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px;">Family Restaurant & Banquet • Varanasi</p>
                </td>
              </tr>

              <!-- Status Banner -->
              <tr>
                <td style="padding: 24px 28px 12px 28px; text-align: center;">
                  <div style="display: inline-block; background-color: ${badgeBg}; border: 1px solid ${badgeBorder}; border-radius: 50px; padding: 8px 18px; margin-bottom: 12px;">
                    <span style="color: ${badgeColor}; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;">${statusBadge}</span>
                  </div>
                  <h2 style="color: #241512; font-size: 20px; margin: 8px 0 4px 0;">Namaste, ${payload.customerName}!</h2>
                  <p style="color: #6b5c58; font-size: 14px; margin: 0; line-height: 1.5;">
                    ${
                      payload.isConfirmed
                        ? 'Your dining reservation is confirmed. We look forward to hosting you and your guests!'
                        : 'Your table reservation request has been received. Our hospitality team is assigning your table.'
                    }
                  </p>
                </td>
              </tr>

              <!-- Reservation Details -->
              <tr>
                <td style="padding: 12px 28px 24px 28px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fdfaf7; border-radius: 12px; padding: 16px; border: 1px solid #f0e6dc;">
                    <tr>
                      <td style="font-size: 13px; color: #6b5c58; padding: 6px 0;">Booking Reference:</td>
                      <td style="font-size: 14px; color: #7B1D1D; font-weight: 700; text-align: right; font-family: monospace;">${payload.bookingReference}</td>
                    </tr>
                    <tr>
                      <td style="font-size: 13px; color: #6b5c58; padding: 6px 0;">Reservation Date:</td>
                      <td style="font-size: 14px; color: #241512; font-weight: 700; text-align: right;">${payload.bookingDate}</td>
                    </tr>
                    <tr>
                      <td style="font-size: 13px; color: #6b5c58; padding: 6px 0;">Time Slot:</td>
                      <td style="font-size: 14px; color: #7B1D1D; font-weight: 700; text-align: right;">${payload.timeSlot} (90 Mins)</td>
                    </tr>
                    <tr>
                      <td style="font-size: 13px; color: #6b5c58; padding: 6px 0;">Guests:</td>
                      <td style="font-size: 14px; color: #241512; font-weight: 700; text-align: right;">${payload.guestCount} People</td>
                    </tr>
                    ${
                      payload.tableNumber
                        ? `<tr>
                      <td style="font-size: 13px; color: #6b5c58; padding: 6px 0;">Assigned Table:</td>
                      <td style="font-size: 14px; color: #241512; font-weight: 700; text-align: right;">Table ${payload.tableNumber}</td>
                    </tr>`
                        : ''
                    }
                    ${
                      payload.specialRequest
                        ? `<tr>
                      <td style="font-size: 13px; color: #6b5c58; padding: 6px 0;">Special Request:</td>
                      <td style="font-size: 13px; color: #241512; font-style: italic; text-align: right;">"${payload.specialRequest}"</td>
                    </tr>`
                        : ''
                    }
                  </table>

                  ${
                    payload.preOrder
                      ? `
                  <div style="margin-top: 16px; background-color: #ffffff; border-radius: 12px; border: 1px solid #ebdcd0; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
                    <div style="background-color: #7B1D1D; color: #ffffff; padding: 10px 16px; font-size: 13px; font-weight: 700;">
                      🍽️ Advance Food Pre-Order (Order #${payload.preOrder.orderNumber})
                    </div>
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 12px 16px;">
                      ${payload.preOrder.items
                        .map(
                          (it) => `
                        <tr>
                          <td style="font-size: 13px; color: #241512; padding: 5px 0;"><strong>${it.name}</strong> × ${it.quantity}</td>
                          <td style="font-size: 13px; color: #7B1D1D; font-weight: 600; text-align: right; padding: 5px 0;">₹${Number(it.lineTotal).toFixed(2)}</td>
                        </tr>`
                        )
                        .join('')}
                      <tr>
                        <td style="font-size: 14px; font-weight: 700; color: #241512; padding-top: 10px; border-top: 1px dashed #e5e7eb;">Total Pre-Order Amount:</td>
                        <td style="font-size: 14px; font-weight: 800; color: #7B1D1D; text-align: right; padding-top: 10px; border-top: 1px dashed #e5e7eb;">₹${Number(payload.preOrder.total).toFixed(2)}</td>
                      </tr>
                    </table>
                    
                    ${
                      payload.paymentUrl
                        ? `
                    <div style="padding: 16px; background-color: #fdfaf7; border-top: 1px solid #ebdcd0; text-align: center;">
                      <a href="${payload.paymentUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #7B1D1D 0%, #521212 100%); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 50px; font-weight: 700; font-size: 14px; border: 2px solid #C9A84C; box-shadow: 0 4px 12px rgba(123, 29, 29, 0.2);">
                        💳 Pay Food Bill Online (₹${Number(payload.preOrder.total).toFixed(2)})
                      </a>
                      <p style="margin: 6px 0 0 0; font-size: 11px; color: #6b5c58;">
                        Pay online now so our chefs can prepare your meal for your arrival.
                      </p>
                    </div>`
                        : `
                    <div style="padding: 8px 16px; background-color: #FFF8F0; font-size: 11px; color: #6b5c58; border-top: 1px solid #ebdcd0;">
                      Payment will be collected at restaurant during dining. Dishes will be queued for your arrival time.
                    </div>`
                    }
                  </div>`
                      : ''
                  }

                  <div style="margin-top: 16px; padding: 12px; background-color: #fffbeb; border-radius: 8px; border: 1px solid #fef3c7; font-size: 12px; color: #92400e;">
                    ℹ️ <strong>Reservation Policy:</strong> Tables are reserved without advance fee and held up to 15 minutes past your reserved time. If you are delayed or need to reschedule, please call us at +91 94152 68463.
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #241512; padding: 24px; text-align: center; color: #FFF8F0;">
                  <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #C9A84C;">Shree Kripa Family Restaurant & Banquet</p>
                  <p style="margin: 0; font-size: 12px; color: #ebdcd0; line-height: 1.4;">
                    Akhari Bypass, Near Toll Plaza, Varanasi, Uttar Pradesh<br/>
                    Phone: +91 9415268463 • Web: https://shri-kripa.vercel.app
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>`;

    const info = await transporter.sendMail({
      from: `"Shree Kripa Restaurant" <${process.env.SMTP_USER}>`,
      to: payload.customerEmail,
      subject: `${statusTitle} #${payload.bookingReference} - Shree Kripa`,
      html,
    });

    console.log('[EmailService] Table booking email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[EmailService] Failed to send table booking email:', err);
    return { success: false, error: err };
  }
}
