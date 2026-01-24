const Excel = require("exceljs");
const { db } = require("@db/db");
const { handleCache } = require("@helpers/cache");

const getLogPage = async (req, res) => {
  try {
    // Get filter parameters
    const {
      activity_type,
      action_type,
      status,
      user_id,
      limit = 1000,
    } = req.query;

    // Build dynamic query with filters
    let query = `
      SELECT 
        id, activity_type, activity, action_type, resource_type, resource_id,
        user_id, username, user_email, user_role,
        ip_address, user_agent, device_type, browser, platform, 
        request_method, request_url, request_id,
        application, environment, server_instance, process_id,
        metadata, status, error_message, error_code, 
        duration_ms, memory_usage_mb, created_at
      FROM activity_logs 
      WHERE 1=1
    `;
    const params = [];

    // Add filters
    if (activity_type) {
      query += " AND activity_type = ?";
      params.push(activity_type);
    }
    if (action_type) {
      query += " AND action_type = ?";
      params.push(action_type);
    }
    if (status) {
      query += " AND status = ?";
      params.push(status);
    }
    if (user_id) {
      query += " AND user_id = ?";
      params.push(user_id);
    }

    query += " ORDER BY created_at DESC LIMIT ?";
    params.push(parseInt(limit, 10));

    // Create cache key that includes filters
    const filterKey = JSON.stringify({
      activity_type,
      action_type,
      status,
      user_id,
      limit,
    });
    const cacheKey = `admin:logs:filtered:${Buffer.from(filterKey).toString("base64").slice(0, 20)}`;

    // Use cache with 2-minute TTL for activity logs
    const result = await handleCache({
      key: cacheKey,
      ttl: 120, // 2 minutes
      dbQueryFn: async () => {
        const [allLogs] = await db.query(query, params);

        // Parse metadata JSON for each log
        return allLogs.map((log) => ({
          ...log,
          parsedMetadata:
            log.metadata && typeof log.metadata === "string"
              ? (() => {
                  try {
                    return JSON.parse(log.metadata);
                  } catch (e) {
                    console.warn(
                      `Failed to parse metadata for log ${log.id}:`,
                      e.message
                    );
                    return null;
                  }
                })()
              : log.metadata,
        }));
      },
    });

    // Get unique values for filters
    const [activityTypes] = await db.query(
      "SELECT DISTINCT activity_type FROM activity_logs WHERE activity_type IS NOT NULL ORDER BY activity_type"
    );
    const [actionTypes] = await db.query(
      "SELECT DISTINCT action_type FROM activity_logs WHERE action_type IS NOT NULL ORDER BY action_type"
    );
    const [statuses] = await db.query(
      "SELECT DISTINCT status FROM activity_logs WHERE status IS NOT NULL ORDER BY status"
    );
    const [users] = await db.query(
      "SELECT DISTINCT user_id, username FROM activity_logs WHERE user_id IS NOT NULL AND username IS NOT NULL ORDER BY username"
    );

    res.render("pages/admin/log/index", {
      logs: result.data,
      filters: {
        activity_type,
        action_type,
        status,
        user_id,
        limit,
      },
      filterOptions: {
        activityTypes: activityTypes.map((row) => row.activity_type),
        actionTypes: actionTypes.map((row) => row.action_type),
        statuses: statuses.map((row) => row.status),
        users: users.map((row) => ({
          id: row.user_id,
          username: row.username,
        })),
      },
      cacheInfo: {
        source: result.source,
        duration_ms: result.duration_ms,
      },
    });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    res.status(500).send("Internal Server Error");
  }
};

const downloadLogData = async (req, res) => {
  try {
    // Apply same filters as the main page
    const {
      activity_type,
      action_type,
      status,
      user_id,
      limit = 10000,
    } = req.query;

    let query = `
      SELECT 
        id, activity_type, activity, action_type, resource_type, resource_id,
        user_id, username, user_email, user_role,
        ip_address, user_agent, device_type, browser, platform, 
        request_method, request_url, request_id,
        application, environment, server_instance, process_id,
        status, error_message, error_code, 
        duration_ms, memory_usage_mb, created_at
      FROM activity_logs 
      WHERE 1=1
    `;
    const params = [];

    // Add filters
    if (activity_type) {
      query += " AND activity_type = ?";
      params.push(activity_type);
    }
    if (action_type) {
      query += " AND action_type = ?";
      params.push(action_type);
    }
    if (status) {
      query += " AND status = ?";
      params.push(status);
    }
    if (user_id) {
      query += " AND user_id = ?";
      params.push(user_id);
    }

    query += " ORDER BY created_at DESC LIMIT ?";
    params.push(parseInt(limit, 10));

    const [logs] = await db.query(query, params);

    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("Activity Logs");

    worksheet.columns = [
      { header: "ID", key: "id", width: 8 },
      { header: "Activity Type", key: "activity_type", width: 12 },
      { header: "Activity", key: "activity", width: 40 },
      { header: "Action Type", key: "action_type", width: 15 },
      { header: "Resource Type", key: "resource_type", width: 15 },
      { header: "Resource ID", key: "resource_id", width: 15 },
      { header: "User ID", key: "user_id", width: 10 },
      { header: "Username", key: "username", width: 15 },
      { header: "User Email", key: "user_email", width: 25 },
      { header: "User Role", key: "user_role", width: 12 },
      { header: "IP Address", key: "ip_address", width: 15 },
      { header: "User Agent", key: "user_agent", width: 30 },
      { header: "Device Type", key: "device_type", width: 15 },
      { header: "Browser", key: "browser", width: 20 },
      { header: "Platform", key: "platform", width: 15 },
      { header: "Request Method", key: "request_method", width: 12 },
      { header: "Request URL", key: "request_url", width: 30 },
      { header: "Request ID", key: "request_id", width: 25 },
      { header: "Application", key: "application", width: 15 },
      { header: "Environment", key: "environment", width: 12 },
      { header: "Server Instance", key: "server_instance", width: 20 },
      { header: "Process ID", key: "process_id", width: 12 },
      { header: "Status", key: "status", width: 12 },
      { header: "Error Message", key: "error_message", width: 30 },
      { header: "Error Code", key: "error_code", width: 15 },
      { header: "Duration (ms)", key: "duration_ms", width: 12 },
      { header: "Memory (MB)", key: "memory_usage_mb", width: 12 },
      { header: "Created At", key: "created_at", width: 20 },
    ];

    // Style untuk header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    // Format data for Excel
    const formattedLogs = logs.map((log) => ({
      ...log,
      created_at: log.created_at
        ? new Date(log.created_at).toLocaleString("id-ID", {
            timeZone: "Asia/Jakarta",
          })
        : "",
    }));

    worksheet.addRows(formattedLogs);

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      if (column.width < 10) column.width = 10;
      if (column.width > 50) column.width = 50;
    });

    const filename = `activity-logs-${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error downloading log data:", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  getLogPage,
  downloadLogData,
};
