const { db } = require("@db/db");
const { asyncHandler } = require("@middlewares/errorHandler");

const getAllJobsPage = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const status = req.query.status || "all";

  const offset = (page - 1) * limit;

  let whereClause = "";
  const params = [];

  if (status && status !== "all") {
    whereClause = "WHERE status = ?";
    params.push(status);
  }

  try {
    const [jobs] = await db.query(
      `SELECT * FROM jobs 
       ${whereClause}
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Parse JSON data for each job with error handling
    const parsedJobs = jobs.map((job) => {
      let formattedData;
      try {
        // Check if data is already an object or string
        if (typeof job.data === "string") {
          const parsed = JSON.parse(job.data);
          formattedData = JSON.stringify(parsed, null, 2);
        } else if (typeof job.data === "object") {
          formattedData = JSON.stringify(job.data, null, 2);
        } else {
          formattedData = String(job.data);
        }
      } catch (parseError) {
        console.error(
          "❌ [QUEUE] Error parsing job data for job ID",
          job.id,
          ":",
          parseError.message
        );
        formattedData = String(job.data); // Fallback to string representation
      }

      return {
        ...job,
        data: formattedData,
      };
    });

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM jobs ${whereClause}`,
      params
    );

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.render("pages/admin/queue/all-jobs", {
      jobs: parsedJobs,
      pagination: {
        currentPage: page,
        limit,
        total,
        totalPages,
      },
      currentStatus: status,
      user: req.session.user,
    });
  } catch (error) {
    console.error("❌ [QUEUE] Error getting all jobs:", error.message);
    res.render("pages/admin/queue/all-jobs", {
      jobs: [],
      pagination: {
        currentPage: 1,
        limit,
        total: 0,
        totalPages: 0,
      },
      currentStatus: status,
      user: req.session.user,
      error: "Failed to load jobs data",
    });
  }
});

module.exports = getAllJobsPage;
