const { getFailedJobs } = require("@helpers/queue");
const { asyncHandler } = require("@middlewares/errorHandler");

const getFailedJobsPage = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  const result = await getFailedJobs(page, limit);

  res.render("pages/admin/queue/failed-jobs", {
    failedJobs: result.jobs,
    pagination: result.pagination,
    user: req.session.user,
  });
});

module.exports = getFailedJobsPage;