import nodemailer from "nodemailer";

export async function sendVerificationEmail(email: string, token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/auth/verify?token=${token}`;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM || `"Mansi's Palette" <noreply@mansispalette.com>`;

  // 1. Try sending via SMTP if credentials are provided
  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port: port || 587,
        secure: port === 465, // true for port 465, false for other ports
        auth: {
          user,
          pass,
        },
      });

      await transporter.sendMail({
        from,
        to: email,
        subject: "Verify your email address - Mansi's Palette",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #3f3a36; background-color: #2b2622; color: #f7f5f0; border-radius: 4px;">
            <div style="margin-bottom: 20px; border-bottom: 1px solid #3f3a36; padding-bottom: 15px; text-align: center;">
              <img src="${baseUrl}/logo-navbar.png" alt="Mansi's Palette" style="height: 32px; display: block; margin: 0 auto;" />
            </div>
            <p style="font-size: 14px; line-height: 1.5; color: #dad2c1;">Hello,</p>
            <p style="font-size: 14px; line-height: 1.5; color: #dad2c1;">Thank you for registering at Mansi's Palette. To complete your account registration and activate your permissions to place orders, add items to the cart, or request custom painting commissions, please verify your email address by clicking the button below:</p>
            
            <div style="margin: 30px 0; text-align: center;">
              <a href="${verifyUrl}" style="background-color: #f7f5f0; color: #2b2622; padding: 12px 24px; text-decoration: none; border-radius: 3px; font-weight: 600; font-size: 13px; display: inline-block;">Verify Email Address</a>
            </div>
            
            <p style="font-size: 12px; line-height: 1.5; color: #aea69c;">If the button above does not work, copy and paste the following URL into your browser:</p>
            <p style="font-size: 12px; word-break: break-all; color: #c9c0ad;"><a href="${verifyUrl}" style="color: #f7f5f0;">${verifyUrl}</a></p>
            
            <hr style="border: 0; border-top: 1px solid #3f3a36; margin: 30px 0;" />
            <p style="font-size: 11px; color: #aea69c; text-align: center; margin: 0;">This is an automated message. Please do not reply directly to this email.</p>
          </div>
        `,
      });

      console.log(`📧 [EMAIL SENT SUCCESS] Verification email sent to ${email} via SMTP.`);
      return;
    } catch (error) {
      console.error("❌ [EMAIL ERROR] Failed to send email via SMTP:", error);
      // Fall through to console simulation logger
    }
  }

  // 2. Fallback console logger for development/testing
  console.log(`
========================================================================
📧 [EMAIL SIMULATION] Verification Email (Fallback)
========================================================================
To:      ${email}
Subject: Verify your email for Mansi's Palette
Link:    ${verifyUrl}
Expires: In 24 hours
Reason:  SMTP variables are not configured in your .env file.
========================================================================
`);
}
