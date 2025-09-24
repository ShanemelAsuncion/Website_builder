import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
// Using inline styles directly to avoid needing CSS inlining libraries (Node 18 compatible)

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendContactEmail({ name, email, phone, service, message }) {
  const recipient = process.env.CONTACT_RECIPIENT || process.env.EMAIL_USER;
  const sentOn = new Date().toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
  const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>New Quote Request</title>
      </head>
      <body style="margin:0; padding:0; background-color:#f9f9f9; font-family: Arial, sans-serif; line-height:1.6; color:#333333;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f9f9f9; padding:20px 0;">
          <tr>
            <td align="center" style="padding:24px 12px;">
              <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%; max-width:600px; background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                <tr>
                  <td align="center" style="background:linear-gradient(135deg,#2563eb 0%, #059669 100%); color:#ffffff; padding:30px 20px;">
                    <div style="display:inline-block; background-color:rgba(255,255,255,0.1); border-radius:50px; padding:15px 25px; margin-bottom:15px;">
                      <span style="font-size:32px; color:#ffffff; font-weight:bold; letter-spacing:1px;">❄️🌿</span>
                    </div>
                    <h1 style="color:#ffffff; font-size:28px; font-weight:bold; margin:0; text-shadow:0 2px 4px rgba(0,0,0,0.3);">Jay's Blade and Snow Services</h1>
                    <p style="color:rgba(255,255,255,0.9); font-size:16px; margin:8px 0 0 0; font-weight:300;">Professional Landscaping • Reliable Snow Removal</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px 20px;">
                    <div style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:20px; margin-bottom:25px;">
                      <h2 style="color:#1e40af; font-size:20px; font-weight:bold; margin:0 0 10px 0;">🎯 New Quote Request Received</h2>
                      <p style="color:#475569; font-size:16px; margin:0;">You have received a new quote request through your website. Here are the customer details:</p>
                    </div>

                    <div style="border:2px solid #e5e7eb; border-radius:12px; overflow:hidden; margin-bottom:25px;">
                      <div style="background-color:#374151; color:#ffffff; padding:15px 20px; font-weight:bold; font-size:18px;">👤 Customer Information</div>
                      <div style="padding:20px;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;">
                          <tr>
                            <td style="padding:8px 0; border-bottom:1px solid #f3f4f6; width:30%; vertical-align:top;"><strong style="color:#374151; font-size:14px;">Name:</strong></td>
                            <td style="padding:8px 0 8px 15px; border-bottom:1px solid #f3f4f6; color:#1f2937; font-size:14px;">${name}</td>
                          </tr>
                          <tr>
                            <td style="padding:8px 0; border-bottom:1px solid #f3f4f6; width:30%; vertical-align:top;"><strong style="color:#374151; font-size:14px;">Email:</strong></td>
                            <td style="padding:8px 0 8px 15px; border-bottom:1px solid #f3f4f6; color:#1f2937; font-size:14px;"><a href="mailto:${email}" style="color:#2563eb; text-decoration:none;">${email}</a></td>
                          </tr>
                          <tr>
                            <td style="padding:8px 0; border-bottom:1px solid #f3f4f6; width:30%; vertical-align:top;"><strong style="color:#374151; font-size:14px;">Phone:</strong></td>
                            <td style="padding:8px 0 8px 15px; border-bottom:1px solid #f3f4f6; color:#1f2937; font-size:14px;">${phone ? `<a href="tel:${phone}" style="color:#2563eb; text-decoration:none;">${phone}</a>` : '<span style="color:#9ca3af; font-style:italic;">Not provided</span>'}</td>
                          </tr>
                          <tr>
                            <td style="padding:8px 0; width:30%; vertical-align:top;"><strong style="color:#374151; font-size:14px;">Service:</strong></td>
                            <td style="padding:8px 0 8px 15px; color:#1f2937; font-size:14px;"><span style="background-color:#dcfce7; color:#166534; padding:4px 8px; border-radius:4px; font-size:13px; font-weight:500;">${service}</span></td>
                          </tr>
                        </table>
                      </div>
                    </div>

                    <div style="border:2px solid #e5e7eb; border-radius:12px; overflow:hidden; margin-bottom:25px;">
                      <div style="background-color:#059669; color:#ffffff; padding:15px 20px; font-weight:bold; font-size:18px;">💬 Customer Message</div>
                      <div style="padding:20px; background-color:#f9fafb;">
                        <div style="background-color:#ffffff; border:1px solid #e5e7eb; border-radius:8px; padding:15px; font-size:14px; line-height:1.6; color:#374151; white-space:pre-wrap;">${message}</div>
                      </div>
                    </div>

                    <div style="text-align:center; padding:20px 0;">
                      <a href="mailto:${email}" style="display:inline-block; background-color:#2563eb; color:#ffffff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:bold; font-size:16px;">📞 Contact Customer Now</a>
                      <p style="color:#6b7280; font-size:14px; margin:10px 0 0 0;">Respond promptly to provide excellent customer service!</p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="background-color:#f3f4f6; padding:20px; text-align:center; border-top:1px solid #e5e7eb;">
                    <p style="color:#6b7280; font-size:12px; margin:0; line-height:1.4;">This email was sent from the contact form on your Blade and Snow Services website.<br /><span style="color:#9ca3af;">Sent on ${sentOn}</span></p>
                    <div style="margin-top:15px; padding-top:15px; border-top:1px solid #d1d5db;">
                      <p style="color:#9ca3af; font-size:11px; margin:0;">Jay's Blade and Snow Services • Professional • Reliable • Trusted</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
  `;

  const mailOptions = {
    from: `"Blade and Snow Services" <${process.env.EMAIL_USER}>`,
    to: recipient,
    replyTo: email,
    subject: `New Quote Request: ${service}`,
    text: `New Quote Request\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\nService: ${service}\n\nMessage:\n${message}\n\nSent on: ${sentOn}`,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
}

export async function sendVerificationEmail({ to, verifyUrl }) {
  const html = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height:1.6; color:#333;">
        <h2>Email Change Verification</h2>
        <p>We received a request to change the admin email for your account.</p>
        <p>Click the link below to verify your new email address:</p>
        <p><a href="${verifyUrl}" style="background:#2563eb; color:#fff; padding:10px 16px; border-radius:6px; text-decoration:none;">Verify Email</a></p>
        <p>If the button doesn't work, copy and paste this URL into your browser:</p>
        <p style="word-break:break-all;"><a href="${verifyUrl}">${verifyUrl}</a></p>
        <p>This link will expire in 24 hours. If you did not request this change, you can ignore this email.</p>
      </body>
    </html>
  `;
  const mailOptions = {
    from: `Website Admin <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Verify your new admin email',
    html,
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.response);
    return info;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
}
