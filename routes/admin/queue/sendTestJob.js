const { sendToQueue } = require("@helpers/queue");
const { invalidateCache } = require("@helpers/cache");
const { getClientIP } = require("@helpers/getClientIP");
const { getUserAgent } = require("@helpers/getUserAgent");
const {
  logUserActivity,
  ACTION_TYPES,
  RESOURCE_TYPES,
  ACTIVITY_STATUS,
} = require("@helpers/log");
const { asyncHandler } = require("@middlewares/errorHandler");

const sendTestJob = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const clientIP = getClientIP(req);
  const userAgent = getUserAgent(req);

  const testData = {
    type: "test_job",
    message: "Test job from admin panel",
    timestamp: new Date().toISOString(),
    triggeredBy: req.session.user.email,
  };

  const success = await sendToQueue("test_queue", testData);

  // Log queue test job operation
  await logUserActivity({
    activity: `${success ? "Successfully sent" : "Failed to send"} test job to queue`,
    actionType: ACTION_TYPES.CREATE,
    resourceType: RESOURCE_TYPES.QUEUE,
    resourceId: "test_queue",
    status: success ? ACTIVITY_STATUS.SUCCESS : ACTIVITY_STATUS.FAILURE,
    userId: req.session.user.id,
    userInfo: {
      username: req.session.user.username,
      email: req.session.user.email,
      role: req.session.user.role,
    },
    requestInfo: {
      ip: clientIP,
      userAgent: userAgent.userAgent,
      deviceType: userAgent.deviceType,
      browser: userAgent.browser,
      platform: userAgent.platform,
      method: req.method,
      url: req.originalUrl,
    },
    metadata: {
      operation: "queue_test_job",
      queueName: "test_queue",
      jobData: testData,
      triggeredBy: req.session.user.username,
      success: success,
    },
    errorMessage: success ? null : "Failed to send test job to queue",
    errorCode: success ? null : "QUEUE_TEST_JOB_FAILED",
    durationMs: Date.now() - startTime,
    req,
  });

  if (success) {
    req.flash("success_msg", "Test job sent successfully!");
    // Invalidate queue cache since stats might change
    await invalidateCache("admin:queue:*", true);
    await invalidateCache("datatable:jobs:*", true); // DataTable cache
    await invalidateCache("datatable:failed-jobs:*", true); // Failed jobs DataTable cache
  } else {
    req.flash(
      "error_msg",
      "Failed to send test job. Check RabbitMQ connection."
    );
  }

  res.redirect("/admin/queue");
});

module.exports = sendTestJob;
