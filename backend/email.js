import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
// Using inline styles directly to avoid needing CSS inlining libraries (Node 18 compatible)

dotenv.config();

// Build transport from env with sensible defaults (Gmail app password by default)
const SMTP_HOST = process.env.SMTP_HOST; // e.g. 'smtp.gmail.com'
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined; // e.g. 465 or 587
const SMTP_SECURE = typeof process.env.SMTP_SECURE !== 'undefined'
  ? /^(1|true|yes)$/i.test(String(process.env.SMTP_SECURE))
  : undefined; // default will be inferred below

const baseAuth = {
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS,
};

// Prefer explicit SMTP settings if provided; otherwise fall back to Gmail service
let transporter;
if (SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT ?? 465,
    secure: typeof SMTP_SECURE === 'boolean' ? SMTP_SECURE : (SMTP_PORT ? SMTP_PORT === 465 : true),
    auth: baseAuth,
    // Pooling and timeouts to reduce ETIMEDOUT risk
    pool: true,
    maxConnections: Number(process.env.SMTP_MAX_CONNECTIONS || 1),
    maxMessages: Number(process.env.SMTP_MAX_MESSAGES || 50),
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT || 15000), // 15s
    greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT || 10000), // 10s
    socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT || 20000), // 20s
    logger: /^(1|true|yes)$/i.test(String(process.env.SMTP_DEBUG || '')),
    debug: /^(1|true|yes)$/i.test(String(process.env.SMTP_DEBUG || '')),
  });
} else {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: baseAuth,
    pool: true,
    maxConnections: Number(process.env.SMTP_MAX_CONNECTIONS || 1),
    maxMessages: Number(process.env.SMTP_MAX_MESSAGES || 50),
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT || 15000),
    greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT || 10000),
    socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT || 20000),
    logger: /^(1|true|yes)$/i.test(String(process.env.SMTP_DEBUG || '')),
    debug: /^(1|true|yes)$/i.test(String(process.env.SMTP_DEBUG || '')),
  });
}

export async function sendContactEmail({ name, email, phone, service, message, brandName, logoUrl, assetBase }) {
  const recipient = process.env.CONTACT_RECIPIENT || process.env.EMAIL_USER;
  const sentOn = new Date().toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
  const derivedBrand = brandName || process.env.BRAND_NAME || "Jay's Blade and Snow Services";
  const derivedLogo = logoUrl || process.env.BRAND_LOGO_URL;
  const backendOrigin = (assetBase || process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');
  const absoluteLogo = derivedLogo && !/^https?:\/\//i.test(derivedLogo)
    ? `${backendOrigin}${derivedLogo.startsWith('/') ? derivedLogo : '/' + derivedLogo}`
    : derivedLogo;
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
                    <h1 style="color:#ffffff; font-size:28px; font-weight:bold; margin:0; text-shadow:0 2px 4px rgba(0,0,0,0.3);">${derivedBrand}</h1>
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
                      <a href="mailto:${email}" style="display:inline-block; background-color:#2563eb; color:#ffffff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:bold; font-size:16px;">✉️ Contact Customer Now</a>
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

  const fromAddress = process.env.MAIL_FROM || process.env.EMAIL_USER;
  const mailOptions = {
    from: `${derivedBrand} <${fromAddress}>`,
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
    console.error('Error sending email:', {
      message: error?.message,
      code: error?.code,
      command: error?.command,
      response: error?.response,
    });
    throw new Error('Failed to send email');
  }
}

export async function sendPasswordResetEmail({ to, userName, brandName, supportEmail, siteUrl, logoUrl, resetUrl: overrideResetUrl, assetBase } = {}) {
  const derivedBrand = brandName || process.env.BRAND_NAME || "Jay's Blade and Snow Services";
  const derivedSupport = supportEmail || process.env.SUPPORT_EMAIL || process.env.EMAIL_USER || 'support@jaysbladeandsnow.com';
  const derivedSiteUrl = siteUrl || process.env.SITE_URL || 'http://localhost:3000';
  const derivedUserName = userName || (to ? String(to).split('@')[0] : 'User');
  const resetUrl = overrideResetUrl || `${derivedSiteUrl}/reset-password`;
  const derivedLogo = logoUrl || process.env.BRAND_LOGO_URL;
  const backendOriginPR = (assetBase || process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');
  const absoluteLogoPR = derivedLogo && !/^https?:\/\//i.test(derivedLogo)
    ? `${backendOriginPR}${derivedLogo.startsWith('/') ? derivedLogo : '/' + derivedLogo}`
    : derivedLogo;

  // Password reset email HTML per provided template, with branding variables injected
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - ${derivedBrand}</title>
    <style type="text/css">
        @media only screen and (max-width: 600px) {
            .email-container { width: 100% !important; max-width: 100% !important; }
            .mobile-padding { padding: 25px 15px !important; }
            .mobile-text { font-size: 14px !important; }
            .mobile-header { font-size: 24px !important; }
            .mobile-button { padding: 12px 24px !important; font-size: 14px !important; }
        }
    </style>
</head>
<body style="margin:0; padding:0; font-family: Arial, sans-serif; line-height:1.6; color:#333; background:#f9f9f9;">
    <div style="padding:20px;">
        <table class="email-container" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px; margin:0 auto; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
            <tr>
                <td style="background: linear-gradient(135deg,#2563eb 0%,#059669 100%); padding:30px 20px; text-align:center;">
                    <h1 style="color:#fff; font-size:28px; font-weight:bold; margin:0;" class="mobile-header">
                        ${derivedBrand}
                    </h1>
                    <p style="color: rgba(255,255,255,0.9); font-size:16px; margin:8px 0 0 0; font-weight:300;">
                        Professional Landscaping • Reliable Snow Removal
                    </p>
                </td>
            </tr>
            <tr>
                <td style="padding:40px 30px;" class="mobile-padding">
                    <div style="margin-bottom:30px;">
                        <h2 style="color:#1e40af; font-size:24px; font-weight:bold; margin:0 0 15px 0;">
                            Hello ${derivedUserName},
                        </h2>
                        <p style="color:#475569; font-size:18px; line-height:1.6; margin:0;" class="mobile-text">
                            You requested to reset your password. Click the button below to proceed.
                        </p>
                    </div>
                    <div style="background-color:#f8fafc; border:2px solid #e2e8f0; border-radius:12px; padding:30px; text-align:center; margin-bottom:30px;">
                        <div style="margin-bottom:25px;">
                            <div style="display:inline-block; background:#fef3c7; border-radius:50px; padding:15px; margin-bottom:15px;">
                                <span style="font-size:32px; color:#d97706;">🔑</span>
                            </div>
                            <h3 style="color:#374151; font-size:20px; font-weight:bold; margin:0 0 10px 0;">
                                Reset Your Password
                            </h3>
                            <p style="color:#6b7280; font-size:16px; margin:0; line-height:1.5;" class="mobile-text">
                                Click the button below to securely reset your password and regain access to your account.
                            </p>
                        </div>
                        <a href="${resetUrl}" style="display:inline-block; background-color:#2563eb; color:#fff; padding:14px 32px; border-radius:8px; text-decoration:none; font-weight:bold; font-size:16px; box-shadow:0 4px 6px rgba(37,99,235,0.25);" class="mobile-button">
                            🔐 Reset Password
                        </a>
                    </div>
                    <div style="background-color:#fef2f2; border:1px solid #fecaca; border-radius:8px; padding:20px; margin-bottom:25px;">
                        <h4 style="color:#dc2626; font-size:16px; font-weight:bold; margin:0 0 10px 0;">
                            🛡️ Security Notice
                        </h4>
                        <p style="color:#991b1b; font-size:14px; line-height:1.5; margin:0;" class="mobile-text">
                            If you did not request a password reset, please ignore this email. The link will expire in 1 hour.
                        </p>
                    </div>
                    <div style="text-align:center; padding:20px 0;">
                        <p style="color:#6b7280; font-size:14px; margin:0 0 10px 0;" class="mobile-text">
                            Need help? Contact us at:
                        </p>
                        <a href="mailto:${derivedSupport}" style="color:#2563eb; text-decoration:none; font-size:14px; font-weight:500;" class="mobile-text">
                            ${derivedSupport}
                        </a>
                    </div>
                </td>
            </tr>
            <tr>
                <td style="background-color:#f3f4f6; padding:20px; text-align:center; border-top:1px solid #e5e7eb;">
                    <p style="color:#6b7280; font-size:12px; margin:0; line-height:1.4;">
                        This email was sent to reset your password for ${derivedBrand}.
                    </p>
                    <div style="margin-top:15px; padding-top:15px; border-top:1px solid #d1d5db;">
                        <p style="color:#9ca3af; font-size:11px; margin:0;">
                            ${derivedBrand} • Professional • Reliable • Trusted
                        </p>
                    </div>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>`;

  const subject = `Reset your password - ${derivedBrand}`;
  const text = `Hello ${derivedUserName},\n\nYou requested to reset your password. Visit: ${resetUrl}\n\nIf you did not request this, you can ignore this email.\n\n— ${derivedBrand}`;

  const fromAddress = process.env.MAIL_FROM || process.env.EMAIL_USER;
  const mailOptions = {
    from: `${derivedBrand} <${fromAddress}>`,
    to: to,
    subject,
    html,
    text,
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.response);
    return info;
  } catch (error) {
    console.error('Error sending password reset email:', {
      message: error?.message,
      code: error?.code,
      command: error?.command,
      response: error?.response,
    });
    throw new Error('Failed to send password reset email');
  }
}

export async function sendVerificationEmail({ to, verifyUrl, userName, brandName, supportEmail, siteUrl, logoUrl, assetBase } = {}) {
  // Derive sensible defaults if not provided
  const derivedBrand = brandName || process.env.BRAND_NAME || "Jay's Blade and Snow Services";
  const derivedSupport = supportEmail || process.env.SUPPORT_EMAIL || process.env.EMAIL_USER || 'support@jaysbladeandsnow.com';
  const derivedSiteUrl = siteUrl || process.env.SITE_URL || (verifyUrl ? new URL(verifyUrl).origin : 'http://localhost:3000');
  const derivedUserName = userName || (to ? String(to).split('@')[0] : 'Admin');
  const derivedLogo = logoUrl || process.env.BRAND_LOGO_URL;
  const backendOriginV = (assetBase || process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');
  const absoluteLogoV = derivedLogo && !/^https?:\/\//i.test(derivedLogo)
    ? `${backendOriginV}${derivedLogo.startsWith('/') ? derivedLogo : '/' + derivedLogo}`
    : derivedLogo;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - ${derivedBrand}</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style type="text/css">
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
                max-width: 100% !important;
            }
            .mobile-padding {
                padding: 25px 15px !important;
            }
            .mobile-text {
                font-size: 14px !important;
            }
            .mobile-header {
                font-size: 24px !important;
            }
            .mobile-button {
                padding: 12px 24px !important;
                font-size: 14px !important;
            }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333333; background-color: #f9f9f9;">
    <div style="padding: 20px;">
        <table cellpadding="0" cellspacing="0" border="0" class="email-container" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <tr>
                <td style="background: linear-gradient(135deg, #2563eb 0%, #059669 100%); padding: 30px 20px; text-align: center;">
                    <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);" class="mobile-header">
                        ${derivedBrand}
                    </h1>
                    <p style="color: rgba(255, 255, 255, 0.9); font-size: 16px; margin: 8px 0 0 0; font-weight: 300;">
                        Professional Landscaping • Reliable Snow Removal
                    </p>
                </td>
            </tr>

            <!-- Main Content -->
            <tr>
                <td style="padding: 40px 30px;" class="mobile-padding">
                    <!-- Greeting -->
                    <div style="margin-bottom: 30px;">
                        <h2 style="color: #1e40af; font-size: 24px; font-weight: bold; margin: 0 0 15px 0;">
                            Hello ${derivedUserName},
                        </h2>
                        <p style="color: #475569; font-size: 18px; line-height: 1.6; margin: 0;" class="mobile-text">
                            Please verify your email to activate your account.
                        </p>
                    </div>

                    <!-- Verification Card -->
                    <div style="background-color: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px;">
                        <div style="margin-bottom: 25px;">
                            <div style="display: inline-block; background-color: #dcfce7; border-radius: 50px; padding: 15px; margin-bottom: 15px;">
                                <span style="font-size: 32px; color: #059669;">✉️</span>
                            </div>
                            <h3 style="color: #374151; font-size: 20px; font-weight: bold; margin: 0 0 10px 0;">
                                Verify Your Email Address
                            </h3>
                            <p style="color: #6b7280; font-size: 16px; margin: 0; line-height: 1.5;" class="mobile-text">
                                Click the button below to confirm your email address and complete your account setup.
                            </p>
                        </div>

                        <!-- Verification Button -->
                        <a href="${derivedSiteUrl}/login" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.25);" class="mobile-button">
                            ✅ Verify Email
                        </a>
                    </div>

                    <!-- Additional Info -->
                    <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                        <h4 style="color: #9a3412; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">
                            🔒 Security Notice
                        </h4>
                        <p style="color: #7c2d12; font-size: 14px; line-height: 1.5; margin: 0;" class="mobile-text">
                            If you did not create an account with ${derivedBrand}, please ignore this email. 
                            This verification link will expire in 24 hours for your security.
                        </p>
                    </div>

                    <!-- Contact Info -->
                    <div style="text-align: center; padding: 20px 0;">
                        <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;" class="mobile-text">
                            Need help? Contact us at:
                        </p>
                        <a href="mailto:${derivedSupport}" style="color: #2563eb; text-decoration: none; font-size: 14px; font-weight: 500;" class="mobile-text">
                            ${derivedSupport}
                        </a>
                    </div>
                </td>
            </tr>

            <!-- Footer -->
            <tr>
                <td style="background-color: #f3f4f6; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 12px; margin: 0; line-height: 1.4;">
                        This email was sent to verify your account with ${derivedBrand}.
                    </p>
                    
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #d1d5db;">
                        <p style="color: #9ca3af; font-size: 11px; margin: 0;">
                            ${derivedBrand} • Professional • Reliable • Trusted
                        </p>
                    </div>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>`;

  const subject = `Verify your email - ${derivedBrand}`;
  const text = `Hello ${derivedUserName},\n\nPlease verify your email to activate your account.\n\nVerification link: ${verifyUrl}\n\nIf you did not request this, you can ignore this email.\n\n— ${derivedBrand}`;

  const fromAddress = process.env.MAIL_FROM || process.env.EMAIL_USER;
  const mailOptions = {
    from: `${derivedBrand} <${fromAddress}>`,
    to,
    subject,
    html,
    text,
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.response);
    return info;
  } catch (error) {
    console.error('Error sending verification email:', {
      message: error?.message,
      code: error?.code,
      command: error?.command,
      response: error?.response,
    });
    throw new Error('Failed to send verification email');
  }
}
