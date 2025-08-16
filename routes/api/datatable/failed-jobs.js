const { db } = require("@db/db");
const { asyncHandler } = require("@middlewares/errorHandler");

const getFailedJobsDataTable = asyncHandler(async (req, res) => {
  const {
    draw = 1,
    start = 0,
    length = 10,
    search = {},
    order = [],
    columns = [],
  } = req.query;

  // Parse DataTables parameters
  const offset = parseInt(start);
  const limit = parseInt(length);
  const searchValue = search.value || "";

  // Base query for failed jobs only
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
    WHERE status = 'failed'
  `;

  let countQuery = `
    SELECT COUNT(*) as total
    FROM jobs
    WHERE status = 'failed'
  `;

  const queryParams = [];
  const countParams = [];

  // Add search functionality
  if (searchValue) {
    const searchCondition = `
      AND (
        CAST(id AS CHAR) LIKE ? OR 
        queue LIKE ? OR 
        data LIKE ? OR
        error LIKE ?
      )
    `;
    query += searchCondition;
    countQuery += searchCondition;

    const searchParam = `%${searchValue}%`;
    queryParams.push(searchParam, searchParam, searchParam, searchParam);
    countParams.push(searchParam, searchParam, searchParam, searchParam);
  }

  // Add column-specific search
  columns.forEach((column, index) => {
    if (column.search?.value) {
      const columnMap = {
        0: "CAST(id AS CHAR)",
        1: "queue",
        2: "data",
        3: "error",
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
      1: "queue",
      2: "data",
      3: "error",
      4: "attempts",
      5: "created_at",
      6: "available_at",
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

    // Get total count of failed jobs
    const [totalResult] = await db.query(`
      SELECT COUNT(*) as total 
      FROM jobs 
      WHERE status = 'failed'
    `);
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

      const attemptsColumn = (() => {
        const badgeClass =
          job.attempts >= job.max_attempts ? "bg-danger" : "bg-warning";
        return `<span class="badge ${badgeClass}">${job.attempts}/${job.max_attempts}</span>`;
      })();

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
        `<span class="badge bg-secondary">${job.queue}</span>`,
        dataColumn,
        errorColumn,
        attemptsColumn,
        formatDateTime(job.created_at),
        formatDateTime(job.available_at || job.retry_at),
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
    console.error(
      "❌ [DATATABLE] Error getting failed jobs data:",
      error.message
    );
    res.status(500).json({
      draw: parseInt(draw),
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
      error: "Failed to load data",
    });
  }
});

module.exports = getFailedJobsDataTable;
