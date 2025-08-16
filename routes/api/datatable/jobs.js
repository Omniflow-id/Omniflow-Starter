const { db } = require("@db/db");
const { asyncHandler } = require("@middlewares/errorHandler");

const getAllJobsDataTable = asyncHandler(async (req, res) => {
  const {
    draw = 1,
    start = 0,
    length = 10,
    search = {},
    order = [],
    columns = [],
    status = "all",
  } = req.query;

  // Parse DataTables parameters
  const offset = parseInt(start);
  const limit = parseInt(length);
  const searchValue = search.value || "";

  // Base query
  let query = `
    SELECT 
      id,
      queue,
      data,
      status,
      attempts,
      max_attempts,
      error,
      created_at,
      started_at,
      completed_at,
      available_at
    FROM jobs
    WHERE 1=1
  `;

  let countQuery = `
    SELECT COUNT(*) as total
    FROM jobs
    WHERE 1=1
  `;

  const queryParams = [];
  const countParams = [];

  // Add status filter
  if (status && status !== "all") {
    const statusCondition = ` AND status = ?`;
    query += statusCondition;
    countQuery += statusCondition;
    queryParams.push(status);
    countParams.push(status);
  }

  // Add search functionality
  if (searchValue) {
    const searchCondition = `
      AND (
        CAST(id AS CHAR) LIKE ? OR 
        queue LIKE ? OR 
        status LIKE ? OR
        data LIKE ? OR
        error LIKE ?
      )
    `;
    query += searchCondition;
    countQuery += searchCondition;

    const searchParam = `%${searchValue}%`;
    queryParams.push(
      searchParam,
      searchParam,
      searchParam,
      searchParam,
      searchParam
    );
    countParams.push(
      searchParam,
      searchParam,
      searchParam,
      searchParam,
      searchParam
    );
  }

  // Add column-specific search
  columns.forEach((column, index) => {
    if (column.search?.value) {
      const columnMap = {
        0: "CAST(id AS CHAR)",
        1: "status",
        2: "queue",
        3: "data",
        4: "CAST(attempts AS CHAR)",
        5: "created_at",
      };

      if (columnMap[index]) {
        const columnSearchCondition = ` AND ${columnMap[index]} LIKE ?`;
        query += columnSearchCondition;
        countQuery += columnSearchCondition;

        const columnSearchParam = `%${column.search.value}%`;
        queryParams.push(columnSearchParam);
        countParams.push(columnSearchParam);
      }
    }
  });

  // Add ordering
  if (order && order.length > 0) {
    const orderColumn = order[0].column;
    const orderDir = order[0].dir === "desc" ? "DESC" : "ASC";

    const columnMap = {
      0: "id",
      1: "status",
      2: "queue",
      3: "data",
      4: "attempts",
      5: "created_at",
      6: "started_at",
      7: "completed_at",
    };

    if (columnMap[orderColumn]) {
      query += ` ORDER BY ${columnMap[orderColumn]} ${orderDir}`;
    }
  } else {
    query += " ORDER BY created_at DESC";
  }

  // Add pagination
  query += " LIMIT ? OFFSET ?";
  queryParams.push(limit, offset);

  try {
    // Get filtered count
    const [countResult] = await db.query(countQuery, countParams);
    const filteredCount = countResult[0].total;

    // Get total count (without filters)
    let totalCountQuery = "SELECT COUNT(*) as total FROM jobs";
    const totalCountParams = [];

    if (status && status !== "all") {
      totalCountQuery += " WHERE status = ?";
      totalCountParams.push(status);
    }

    const [totalResult] = await db.query(totalCountQuery, totalCountParams);
    const totalCount = totalResult[0].total;

    // Get data
    const [jobs] = await db.query(query, queryParams);

    // Format data for DataTables
    const data = jobs.map((job) => {
      // Parse JSON data safely
      let formattedData;
      try {
        if (typeof job.data === "string") {
          const parsed = JSON.parse(job.data);
          formattedData = JSON.stringify(parsed, null, 2);
        } else if (typeof job.data === "object") {
          formattedData = JSON.stringify(job.data, null, 2);
        } else {
          formattedData = String(job.data);
        }
      } catch (_parseError) {
        formattedData = String(job.data);
      }

      const statusBadge = (() => {
        switch (job.status) {
          case "pending":
            return '<span class="badge bg-warning">Pending</span>';
          case "processing":
            return '<span class="badge bg-info">Processing</span>';
          case "completed":
            return '<span class="badge bg-success">Completed</span>';
          case "failed":
            return '<span class="badge bg-danger">Failed</span>';
          default:
            return `<span class="badge bg-secondary">${job.status}</span>`;
        }
      })();

      const dataColumn = `
        <button
          class="btn btn-sm btn-outline-info"
          data-bs-toggle="collapse"
          data-bs-target="#job-data-${job.id}"
        >
          <i class="fas fa-eye"></i> View
        </button>
        <div class="collapse mt-2" id="job-data-${job.id}">
          <pre class="small bg-light p-2 rounded"><code>${formattedData}</code></pre>
        </div>
      `;

      const attemptsColumn = (() => {
        const badgeClass =
          job.attempts >= job.max_attempts ? "bg-danger" : "bg-warning";
        return `<span class="badge ${badgeClass}">${job.attempts}/${job.max_attempts}</span>`;
      })();

      const errorColumn = job.error
        ? `
        <button
          class="btn btn-sm btn-outline-danger"
          data-bs-toggle="collapse"
          data-bs-target="#job-error-${job.id}"
        >
          <i class="fas fa-exclamation-triangle"></i> Error
        </button>
        <div class="collapse mt-2" id="job-error-${job.id}">
          <div class="alert alert-danger small mb-0">
            ${job.error}
          </div>
        </div>
      `
        : '<small class="text-muted">-</small>';

      const formatDateTime = (dateTime) => {
        if (!dateTime) return '<small class="text-muted">-</small>';
        return `<small>${new Date(dateTime).toLocaleString("id-ID", {
          timeZone: "Asia/Jakarta",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}</small>`;
      };

      return [
        `<code>#${job.id}</code>`,
        statusBadge,
        `<span class="badge bg-secondary">${job.queue}</span>`,
        dataColumn,
        attemptsColumn,
        formatDateTime(job.created_at),
        formatDateTime(job.started_at),
        formatDateTime(job.completed_at),
        errorColumn,
      ];
    });

    // Return DataTables response
    res.json({
      draw: parseInt(draw),
      recordsTotal: totalCount,
      recordsFiltered: filteredCount,
      data: data,
    });
  } catch (error) {
    console.error("❌ [DATATABLE] Error getting jobs data:", error.message);
    res.status(500).json({
      draw: parseInt(draw),
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
      error: "Failed to load data",
    });
  }
});

module.exports = getAllJobsDataTable;
