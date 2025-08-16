const { db } = require("@db/db");
const { asyncHandler } = require("@middlewares/errorHandler");

const getLogsDataTable = asyncHandler(async (req, res) => {
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

  // Base query
  let query = `
    SELECT 
      id,
      activity_type,
      action_type,
      status,
      username,
      user_role,
      activity,
      error_message,
      created_at,
      duration_ms,
      metadata
    FROM activity_logs
    WHERE 1=1
  `;

  let countQuery = `
    SELECT COUNT(*) as total
    FROM activity_logs
    WHERE 1=1
  `;

  const queryParams = [];
  const countParams = [];

  // Add search functionality
  if (searchValue) {
    const searchCondition = `
      AND (
        activity LIKE ? OR 
        username LIKE ? OR 
        user_role LIKE ? OR
        activity_type LIKE ? OR
        action_type LIKE ? OR
        status LIKE ? OR
        error_message LIKE ?
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
      searchParam,
      searchParam,
      searchParam
    );
    countParams.push(
      searchParam,
      searchParam,
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
        0: "id",
        1: "activity_type",
        2: "action_type",
        3: "status",
        4: "username",
        5: "activity",
        6: "created_at",
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
      1: "activity_type",
      2: "action_type",
      3: "status",
      4: "username",
      5: "activity",
      6: "created_at",
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
    const [totalResult] = await db.query(`
      SELECT COUNT(*) as total 
      FROM activity_logs
    `);
    const totalCount = totalResult[0].total;

    // Get data
    const [logs] = await db.query(query, queryParams);

    // Format data for DataTables
    const data = logs.map((log) => {
      // Parse metadata safely
      let parsedMetadata = null;
      if (log.metadata) {
        try {
          parsedMetadata =
            typeof log.metadata === "string"
              ? JSON.parse(log.metadata)
              : log.metadata;
        } catch (_e) {
          parsedMetadata = null;
        }
      }

      return [
        log.id,
        log.activity_type === "user"
          ? '<span class="badge bg-primary">User</span>'
          : '<span class="badge bg-secondary">System</span>',
        log.action_type
          ? `<span class="badge bg-info">${log.action_type.toUpperCase()}</span>`
          : "-",
        (() => {
          switch (log.status) {
            case "success":
              return '<span class="badge bg-success">Success</span>';
            case "failure":
              return '<span class="badge bg-danger">Failure</span>';
            case "warning":
              return '<span class="badge bg-warning text-dark">Warning</span>';
            case "info":
              return '<span class="badge bg-info">Info</span>';
            default:
              return `<span class="badge bg-light text-dark">${log.status || "-"}</span>`;
          }
        })(),
        log.username
          ? `<div class="user-info">
               <strong>${log.username}</strong>
               ${log.user_role ? `<br><small class="text-muted">${log.user_role}</small>` : ""}
             </div>`
          : '<span class="text-muted">-</span>',
        `<div class="activity-cell">
           ${log.activity}
           ${log.error_message ? `<br><small class="text-danger"><i class="fas fa-exclamation-triangle"></i> ${log.error_message}</small>` : ""}
         </div>`,
        `<div class="time-info">
           ${new Date(log.created_at).toLocaleString("id-ID", {
             timeZone: "Asia/Jakarta",
             year: "numeric",
             month: "2-digit",
             day: "2-digit",
             hour: "2-digit",
             minute: "2-digit",
             second: "2-digit",
           })}
           ${log.duration_ms ? `<br><small class="text-muted">${log.duration_ms}ms</small>` : ""}
         </div>`,
        `<button 
           class="btn btn-sm btn-outline-primary btn-details" 
           data-log-data='${JSON.stringify({
             ...log,
             parsedMetadata,
           })}'
           title="View Details">
           <i class="fas fa-eye"></i>
         </button>`,
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
    console.error("❌ [DATATABLE] Error getting logs data:", error.message);
    res.status(500).json({
      draw: parseInt(draw),
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
      error: "Failed to load data",
    });
  }
});

module.exports = getLogsDataTable;
