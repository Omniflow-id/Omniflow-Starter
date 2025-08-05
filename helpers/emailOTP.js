// === Third-party modules ===
const nodemailer = require("nodemailer");

// === Absolute / alias imports ===
const config = require("@/config");

// Create transporter for sending emails
const createTransporter = () => {
  if (!config.email.enabled) {
    throw new Error(
      "Email service is not enabled. Set EMAIL_ENABLED=true in .env"
    );
  }

  return nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465, // true for 465, false for other ports
    auth: {
      user: config.email.user,
      pass: config.email.password,
    },
  });
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
const sendOTPEmail = async (email, otp, userFullName = "Admin") => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${config.email.fromName || "Omniflow Starter"}" <${
        config.email.fromEmail || config.email.user
      }>`,
      to: email,
      subject: "Your OTP Code - Omniflow Admin Login",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your OTP Code</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1); overflow: hidden; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 40px 30px; }
            .otp-box { background: #f8f9ff; border: 2px dashed #667eea; border-radius: 10px; padding: 30px; text-align: center; margin: 30px 0; }
            .otp-code { font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; margin: 10px 0; font-family: 'Courier New', monospace; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0; color: #856404; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #6c757d; }
            .security-tip { background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 5px; padding: 15px; margin: 20px 0; color: #0c5460; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Admin Login Verification</h1>
              <p>Secure access to your Omniflow admin panel</p>
            </div>
            <div class="content">
              <p>Hello <strong>${userFullName}</strong>,</p>
              <p>You have requested to login to the Omniflow admin panel. Please use the following One-Time Password (OTP) to complete your login:</p>
              
              <div class="otp-box">
                <p style="margin: 0; font-size: 18px; color: #666;">Your OTP Code:</p>
                <div class="otp-code">${otp}</div>
                <p style="margin: 0; font-size: 14px; color: #888;">Valid for 5 minutes only</p>
              </div>

              <div class="warning">
                <strong>⚠️ Important:</strong> This OTP will expire in <strong>5 minutes</strong> and can only be used once.
              </div>

              <div class="security-tip">
                <strong>🛡️ Security Tip:</strong> If you didn't request this login, please ignore this email and ensure your account credentials are secure.
              </div>

              <p>Thank you for using Omniflow Starter!</p>
            </div>
            <div class="footer">
              <p>This is an automated message from Omniflow Starter Admin System</p>
              <p>© ${new Date().getFullYear()} Omniflow. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hello ${userFullName},

You have requested to login to the Omniflow admin panel.

Your OTP Code: ${otp}

This code will expire in 5 minutes and can only be used once.

If you didn't request this login, please ignore this email.

Thank you for using Omniflow Starter!
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    return {
      success: true,
      messageId: result.messageId,
      response: result.response,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

// Verify OTP
const verifyOTP = (inputOTP, sessionOTP, expiresAt) => {
  if (!inputOTP || !sessionOTP) {
    return { valid: false, reason: "OTP is required" };
  }

  if (Date.now() > expiresAt) {
    return { valid: false, reason: "OTP has expired" };
  }

  if (inputOTP.toString() !== sessionOTP.toString()) {
    return { valid: false, reason: "Invalid OTP code" };
  }

  return { valid: true };
};

// Create OTP session data
const createOTPSession = (user, otp) => {
  return {
    userId: user.id,
    email: user.email,
    username: user.username,
    fullName: user.full_name,
    role: user.role,
    otp: otp,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes from now
    createdAt: Date.now(),
  };
};

// Check if development bypass is enabled
const isDevelopmentBypass = () => {
  return process.env.DEV_2FA_BYPASS === "true";
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  verifyOTP,
  createOTPSession,
  isDevelopmentBypass,
};
