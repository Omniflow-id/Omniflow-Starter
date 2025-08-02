const { retryFailedJobs } = require("@helpers/queue");
const { invalidateCache } = require("@helpers/cache");
const { asyncHandler } = require("@middlewares/errorHandler");

const retryFailedJobsAction = asyncHandler(async (req, res) => {
  const retriedCount = await retryFailedJobs(10);

  if (retriedCount > 0) {
    req.flash("success_msg", `Successfully retried ${retriedCount} failed jobs.`);
    // Invalidate queue cache since stats will change
    await invalidateCache("admin:queue:*", true);
  } else {
    req.flash("error_msg", "No failed jobs to retry or RabbitMQ connection failed.");
  }

  res.redirect("/admin/queue");
});

module.exports = retryFailedJobsAction;