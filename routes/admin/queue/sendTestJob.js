const { sendToQueue } = require("@helpers/queue");
const { invalidateCache } = require("@helpers/cache");
const { asyncHandler } = require("@middlewares/errorHandler");

const sendTestJob = asyncHandler(async (req, res) => {
  const testData = {
    type: "test_job",
    message: "Test job from admin panel",
    timestamp: new Date().toISOString(),
    triggeredBy: req.session.user.email,
  };

  const success = await sendToQueue("test_queue", testData);

  if (success) {
    req.flash("success_msg", "Test job sent successfully!");
    // Invalidate queue cache since stats might change
    await invalidateCache("admin:queue:*", true);
  } else {
    req.flash(
      "error_msg",
      "Failed to send test job. Check RabbitMQ connection."
    );
  }

  res.redirect("/admin/queue");
});

module.exports = sendTestJob;
