// === Third-party modules ===
const Excel = require("exceljs");

// === Absolute / alias imports ===
const { db } = require("@db/db");
const { getClientIP } = require("@helpers/getClientIP");
const { getUserAgent } = require("@helpers/getUserAgent");
const {
  LOG_LEVELS,
  logUserActivity,
  ACTION_TYPES,
  RESOURCE_TYPES,
  ACTIVITY_STATUS,
} = require("@helpers/log");

const downloadUserData = async (req, res) => {
  try {
    // Query database untuk mendapatkan semua user
    const [users] = await db.query(`
      SELECT id, username, email, full_name, role, is_active
      FROM users
      ORDER BY id
    `);

    // Buat workbook dan worksheet baru
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("Users");

    // Definisikan kolom
    worksheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Nama", key: "username", width: 30 },
      { header: "Email", key: "email", width: 30 },
      { header: "Nama Lengkap", key: "full_name", width: 35 },
      { header: "Role", key: "role", width: 15 },
      { header: "Status", key: "is_active", width: 15 },
    ];

    // Style untuk header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    // Format data untuk display yang user-friendly
    const formattedUsers = users.map((user) => ({
      ...user,
      is_active: user.is_active ? "Active" : "Inactive",
    }));

    // Tambahkan data
    worksheet.addRows(formattedUsers);

    // Set response header
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=users-data.xlsx"
    );

    await workbook.xlsx.write(res);

    const ip = getClientIP(req);
    const userAgentData = getUserAgent(req);

    await logUserActivity({
      activity: "Downloaded complete user data export",
      actionType: ACTION_TYPES.EXPORT,
      resourceType: RESOURCE_TYPES.USER,
      resourceId: "users_export",
      status: ACTIVITY_STATUS.SUCCESS,
      userId: req.session.user.id,
      requestInfo: {
        ip,
        userAgent: userAgentData.userAgent,
        deviceType: userAgentData.deviceType,
        browser: userAgentData.browser,
        platform: userAgentData.platform,
        method: req.method,
        url: req.originalUrl,
      },
      metadata: {
        exportType: "complete_user_data",
        format: "xlsx",
        fileName: "users-data.xlsx",
        recordsExported: users.length,
        columnsExported: [
          "id",
          "username",
          "email",
          "full_name",
          "role",
          "is_active",
        ],
        dataSource: "users_table",
      },
      req,
    });

    res.end();
  } catch (error) {
    const clientIP = getClientIP(req);
    const userAgent = getUserAgent(req);

    await logUserActivity({
      activity: "Failed to download user data export",
      actionType: ACTION_TYPES.EXPORT,
      resourceType: RESOURCE_TYPES.USER,
      resourceId: "users_export",
      status: ACTIVITY_STATUS.FAILURE,
      userId: req.session?.user?.id,
      requestInfo: {
        ip: clientIP,
        userAgent: userAgent.userAgent,
        deviceType: userAgent.deviceType,
        browser: userAgent.browser,
        platform: userAgent.platform,
        method: req.method,
        url: req.originalUrl,
      },
      errorMessage: error.message,
      errorCode: error.code || "USER_DATA_EXPORT_FAILED",
      metadata: {
        exportType: "complete_user_data",
        errorDetails: error.name,
      },
      req,
      level: LOG_LEVELS.ERROR,
    });

    res.status(500).send("Internal Server Error");
  }
};

module.exports = { downloadUserData };
