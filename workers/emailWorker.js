// === Third-party modules ===
const nodemailer = require("nodemailer");

// === Absolute / alias imports ===
const config = require("@/config");
const { consume } = require("@helpers/queue");
const {
  LOG_LEVELS,
  logSystemActivity,
  ACTIVITY_STATUS,
} = require("@helpers/log");

class EmailWorker {
  constructor() {
    this.transporter = null;
    this.isRunning = false;
    this.processedCount = 0;
    this.errorCount = 0;
  }

  // Create email transporter
  createTransporter() {
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
  }

  // Send OTP email
  async sendOTPEmail(email, otp, userFullName = "User") {
    try {
      if (!this.transporter) {
        this.transporter = this.createTransporter();
      }

      const mailOptions = {
        from: `"${config.email.fromName || "Omniflow Starter"}" <${config.email.fromEmail || config.email.user}>`,
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

      const result = await this.transporter.sendMail(mailOptions);
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
  }

  // Send welcome email
  async sendWelcomeEmail(email, userFullName, tempPassword) {
    try {
      if (!this.transporter) {
        this.transporter = this.createTransporter();
      }

      const mailOptions = {
        from: `"${config.email.fromName || "Omniflow Starter"}" <${config.email.fromEmail || config.email.user}>`,
        to: email,
        subject: "Welcome to Omniflow - Your Account is Ready!",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Omniflow</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1); overflow: hidden; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
              .header h1 { margin: 0; font-size: 28px; }
              .content { padding: 40px 30px; }
              .credentials-box { background: #f8f9ff; border: 2px solid #667eea; border-radius: 10px; padding: 30px; margin: 30px 0; }
              .credential-item { margin: 15px 0; padding: 10px; background: white; border-radius: 5px; border-left: 4px solid #667eea; }
              .credential-label { font-weight: bold; color: #667eea; }
              .credential-value { font-family: 'Courier New', monospace; font-size: 16px; color: #333; }
              .warning { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0; color: #856404; }
              .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #6c757d; }
              .btn { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Welcome to Omniflow!</h1>
                <p>Your admin account has been created successfully</p>
              </div>
              <div class="content">
                <p>Hello <strong>${userFullName}</strong>,</p>
                <p>Your Omniflow admin account has been created. Here are your login credentials:</p>
                
                <div class="credentials-box">
                  <div class="credential-item">
                    <div class="credential-label">Email:</div>
                    <div class="credential-value">${email}</div>
                  </div>
                  <div class="credential-item">
                    <div class="credential-label">Temporary Password:</div>
                    <div class="credential-value">${tempPassword}</div>
                  </div>
                </div>

                <div class="warning">
                  <strong>🔒 Security Notice:</strong> Please change your password after your first login for security reasons.
                </div>

                <p style="text-align: center;">
                  <a href="${config.app.url}/admin/login" class="btn">Login to Omniflow Admin</a>
                </p>

                <p>If you have any questions, please contact your system administrator.</p>
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
Welcome to Omniflow!

Hello ${userFullName},

Your Omniflow admin account has been created successfully.

Login Credentials:
Email: ${email}
Temporary Password: ${tempPassword}

Please change your password after your first login for security reasons.

Login URL: ${config.app.url}/admin/login

Thank you for using Omniflow Starter!
        `,
      };

      const result = await this.transporter.sendMail(mailOptions);
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
  }

  // Process email job
  async processEmailJob(data) {
    const startTime = Date.now();

    try {
      console.log("📧 [EMAIL-WORKER] Processing email job:", {
        type: data.type,
        to: data.to,
        jobId: data.jobId,
      });

      let result;

      switch (data.type) {
        case "otp_email":
          result = await this.sendOTPEmail(data.to, data.otp, data.fullName);
          break;

        case "welcome_email":
          result = await this.sendWelcomeEmail(
            data.to,
            data.fullName,
            data.tempPassword
          );
          break;

        default:
          throw new Error(`Unknown email type: ${data.type}`);
      }

      const duration = Date.now() - startTime;

      if (result.success) {
        this.processedCount++;
        console.log("✅ [EMAIL-WORKER] Email sent successfully:", {
          type: data.type,
          to: data.to,
          messageId: result.messageId,
          duration: `${duration}ms`,
        });

        // Log successful email activity
        await logSystemActivity({
          activity: `Email sent successfully via worker: ${data.type}`,
          metadata: {
            eventType: "email_sent",
            emailType: data.type,
            recipient: data.to,
            messageId: result.messageId,
            duration_ms: duration,
            workerStats: {
              processed: this.processedCount,
              errors: this.errorCount,
            },
          },
          status: ACTIVITY_STATUS.SUCCESS,
          level: LOG_LEVELS.INFO,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.errorCount++;
      console.error("❌ [EMAIL-WORKER] Failed to send email:", {
        type: data.type,
        to: data.to,
        error: error.message,
        jobId: data.jobId,
      });

      // Log failed email activity
      await logSystemActivity({
        activity: `Email sending failed via worker: ${data.type}`,
        metadata: {
          eventType: "email_failed",
          emailType: data.type,
          recipient: data.to,
          error: error.message,
          workerStats: {
            processed: this.processedCount,
            errors: this.errorCount,
          },
        },
        status: ACTIVITY_STATUS.FAILURE,
        level: LOG_LEVELS.ERROR,
      });

      throw error; // Re-throw to trigger retry logic
    }
  }

  // Start email worker
  async start() {
    if (this.isRunning) {
      console.log("⚠️ [EMAIL-WORKER] Already running");
      return;
    }

    try {
      // Check if email is enabled
      if (!config.email.enabled) {
        console.log(
          "⚠️ [EMAIL-WORKER] Email service disabled - worker not started"
        );
        return;
      }

      console.log("🚀 [EMAIL-WORKER] Starting email worker...");

      // Test email connection
      this.transporter = this.createTransporter();
      await this.transporter.verify();
      console.log("✅ [EMAIL-WORKER] Email connection verified");

      // Start consuming email queue
      const success = await consume("email_queue", async (data) => {
        await this.processEmailJob(data);
      });

      if (success) {
        this.isRunning = true;
        console.log("👂 [EMAIL-WORKER] Email worker started successfully");

        // Log worker startup
        await logSystemActivity({
          activity: "Email worker started successfully",
          metadata: {
            eventType: "email_worker_started",
            emailEnabled: config.email.enabled,
            smtpHost: config.email.host,
            smtpPort: config.email.port,
            workerStats: {
              processed: this.processedCount,
              errors: this.errorCount,
            },
          },
          status: ACTIVITY_STATUS.SUCCESS,
          level: LOG_LEVELS.INFO,
        });
      } else {
        throw new Error("Failed to start consuming email queue");
      }
    } catch (error) {
      console.error(
        "❌ [EMAIL-WORKER] Failed to start email worker:",
        error.message
      );

      // Log worker startup failure
      await logSystemActivity({
        activity: "Email worker failed to start",
        metadata: {
          eventType: "email_worker_failed",
          error: error.message,
          emailEnabled: config.email.enabled,
        },
        status: ACTIVITY_STATUS.FAILURE,
        level: LOG_LEVELS.ERROR,
      });

      throw error;
    }
  }

  // Stop email worker
  async stop() {
    this.isRunning = false;
    if (this.transporter) {
      this.transporter.close();
      this.transporter = null;
    }
    console.log("🛑 [EMAIL-WORKER] Email worker stopped");
  }

  // Get worker stats
  getStats() {
    return {
      isRunning: this.isRunning,
      processed: this.processedCount,
      errors: this.errorCount,
      successRate:
        this.processedCount > 0
          ? (
              (this.processedCount / (this.processedCount + this.errorCount)) *
              100
            ).toFixed(2)
          : 0,
    };
  }
}

module.exports = EmailWorker;
