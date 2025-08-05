// === Absolute / alias imports ===
const { sendToQueue } = require("@helpers/queue");
const config = require("@/config");

// Queue-based email functions for non-blocking email sending

// Send OTP email via queue (non-blocking)
const queueOTPEmail = async (
  email,
  otp,
  userFullName = "User",
  options = {}
) => {
  try {
    const emailData = {
      type: "otp_email",
      to: email,
      otp: otp,
      fullName: userFullName,
      timestamp: new Date().toISOString(),
      ...options.metadata,
    };

    const success = await sendToQueue("email_queue", emailData, {
      priority: 10, // High priority for OTP emails
      maxAttempts: 3,
      ...options,
    });

    if (success) {
      console.log("📤 [QUEUED-EMAIL] OTP email queued successfully:", {
        to: email,
        otp: otp.replace(/./g, "*"), // Mask OTP in logs
        fullName: userFullName,
      });
      return { success: true, queued: true };
    } else {
      throw new Error("Failed to queue OTP email");
    }
  } catch (error) {
    console.error("❌ [QUEUED-EMAIL] Failed to queue OTP email:", {
      error: error.message,
      to: email,
    });
    return { success: false, error: error.message };
  }
};

// Send welcome email via queue (non-blocking)
const queueWelcomeEmail = async (
  email,
  userFullName,
  tempPassword,
  options = {}
) => {
  try {
    const emailData = {
      type: "welcome_email",
      to: email,
      fullName: userFullName,
      tempPassword: tempPassword,
      timestamp: new Date().toISOString(),
      ...options.metadata,
    };

    const success = await sendToQueue("email_queue", emailData, {
      priority: 5, // Normal priority for welcome emails
      maxAttempts: 5, // More retries for welcome emails
      ...options,
    });

    if (success) {
      console.log("📤 [QUEUED-EMAIL] Welcome email queued successfully:", {
        to: email,
        fullName: userFullName,
      });
      return { success: true, queued: true };
    } else {
      throw new Error("Failed to queue welcome email");
    }
  } catch (error) {
    console.error("❌ [QUEUED-EMAIL] Failed to queue welcome email:", {
      error: error.message,
      to: email,
    });
    return { success: false, error: error.message };
  }
};

// Send generic email via queue
const queueEmail = async (emailData, options = {}) => {
  try {
    const enrichedData = {
      ...emailData,
      timestamp: new Date().toISOString(),
    };

    const success = await sendToQueue("email_queue", enrichedData, {
      priority: options.priority || 5,
      maxAttempts: options.maxAttempts || 3,
      ...options,
    });

    if (success) {
      console.log("📤 [QUEUED-EMAIL] Email queued successfully:", {
        type: emailData.type,
        to: emailData.to,
      });
      return { success: true, queued: true };
    } else {
      throw new Error("Failed to queue email");
    }
  } catch (error) {
    console.error("❌ [QUEUED-EMAIL] Failed to queue email:", {
      error: error.message,
      type: emailData.type,
      to: emailData.to,
    });
    return { success: false, error: error.message };
  }
};

// Fallback to synchronous email if queue is not available
const fallbackToSyncEmail = async (emailType, ...args) => {
  console.warn(
    "⚠️ [QUEUED-EMAIL] Queue not available, falling back to synchronous email"
  );

  try {
    // Import sync email functions
    const { sendOTPEmail } = require("@helpers/emailOTP");

    switch (emailType) {
      case "otp_email": {
        const [email, otp, fullName] = args;
        return await sendOTPEmail(email, otp, fullName);
      }
      default:
        throw new Error(`Unsupported fallback email type: ${emailType}`);
    }
  } catch (error) {
    console.error("❌ [QUEUED-EMAIL] Fallback email failed:", error.message);
    return { success: false, error: error.message };
  }
};

// Smart email sending with timeout-based fallback
const sendEmailSmart = async (emailType, ...args) => {
  // Check if RabbitMQ is enabled and connected
  const { queueService } = require("@helpers/queue");

  if (config.rabbitmq.enabled && queueService.isConnected) {
    // Use queue-based approach with timeout
    try {
      const queueTimeout = parseInt(process.env.EMAIL_QUEUE_TIMEOUT) || 150;
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Queue timeout")), queueTimeout)
      );

      let queuePromise;
      switch (emailType) {
        case "otp_email":
          queuePromise = queueOTPEmail(...args);
          break;
        case "welcome_email":
          queuePromise = queueWelcomeEmail(...args);
          break;
        default:
          queuePromise = queueEmail({ type: emailType, ...args[0] }, args[1]);
      }

      // Race between queue operation and timeout
      const result = await Promise.race([queuePromise, timeoutPromise]);

      console.log(
        "⚡ [QUEUED-EMAIL] Queue operation successful within timeout"
      );
      return { ...result, method: "queue" };
    } catch (error) {
      if (error.message === "Queue timeout") {
        console.warn(
          `⏱️ [QUEUED-EMAIL] Queue timeout (>${queueTimeout}ms), falling back to synchronous email`
        );
      } else {
        console.warn(
          "⚠️ [QUEUED-EMAIL] Queue error, falling back to synchronous email:",
          error.message
        );
      }

      // Fallback to sync email
      return await fallbackToSyncEmail(emailType, ...args);
    }
  } else {
    // Fallback to synchronous approach
    console.warn(
      "⚠️ [QUEUED-EMAIL] Queue unavailable, using synchronous fallback"
    );
    return await fallbackToSyncEmail(emailType, ...args);
  }
};

module.exports = {
  queueOTPEmail,
  queueWelcomeEmail,
  queueEmail,
  sendEmailSmart,
  fallbackToSyncEmail,
};
