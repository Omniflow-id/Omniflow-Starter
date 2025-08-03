// Quick BeepBot test script
require("module-alias/register");
require("dotenv").config();

const {
  notifyInfo,
  notifyError,
  notifyCritical,
  notifyDatabaseError,
  checkConfig,
} = require("@helpers/beepbot");

async function testBeepBot() {
  console.log("🧪 [TEST] BeepBot configuration:");
  console.log(checkConfig());

  console.log("\n🧪 [TEST] Testing BeepBot notifications...");

  try {
    // Test basic notification
    await notifyInfo("Test notification from Omniflow-Starter", "test", {
      testType: "basic_notification",
      timestamp: new Date().toISOString(),
    });

    // Test error notification
    await notifyError("Test error notification", "test", {
      errorType: "test_error",
      severity: "medium",
    });

    // Test critical notification
    await notifyCritical("Test critical notification", "test", {
      errorType: "test_critical",
      severity: "high",
    });

    // Test database error notification
    const mockDbError = new Error("Connection timeout");
    mockDbError.code = "ETIMEDOUT";
    mockDbError.errno = 110;
    mockDbError.sqlState = "HY000";

    await notifyDatabaseError(mockDbError, {
      host: "localhost",
      database: "test_db",
      operation: "test_connection",
    });

    console.log("✅ [TEST] All notifications sent successfully!");
  } catch (error) {
    console.error("❌ [TEST] Error testing BeepBot:", error.message);
  }
}

testBeepBot();
