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

const downloadUserTemplate = async (req, res) => {
  try {
    // Query database untuk mendapatkan role yang tersedia
    const [roleResults] = await db.query(
      "SELECT DISTINCT role FROM users ORDER BY role"
    );
    const availableRoles = roleResults.map((row) => row.role);

    // Jika tidak ada role di database, gunakan default dari enum
    const defaultRoles = ["Admin", "Manager", "User"];
    const roles = availableRoles.length > 0 ? availableRoles : defaultRoles;

    // Buat workbook dan worksheet baru
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("User Template");

    // Definisikan kolom berdasarkan struktur database (4 columns - password auto-generated)
    worksheet.columns = [
      { header: "Username", key: "username", width: 30 },
      { header: "Email", key: "email", width: 35 },
      { header: "Nama Lengkap", key: "full_name", width: 35 },
      { header: "Role", key: "role", width: 20 },
    ];

    // Style untuk header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    // Tambahkan contoh data berdasarkan role yang tersedia (password auto-generated)
    const exampleData = roles.slice(0, 3).map((role, index) => ({
      username: `contoh_user_${index + 1}`,
      email: `user${index + 1}@example.com`,
      full_name: `Contoh User ${index + 1}`,
      role: role,
    }));

    worksheet.addRows(exampleData);

    // Tambahkan instruksi penggunaan template
    worksheet.addRow([]);
    worksheet.addRow(["=== INSTRUKSI PENGGUNAAN TEMPLATE ==="]);
    worksheet.addRow([
      "1. Hapus baris contoh dan instruksi ini sebelum upload",
    ]);
    worksheet.addRow([
      "2. Password akan dibuat otomatis dengan pola: NamaLengkap@12345?.",
    ]);
    worksheet.addRow(["3. Contoh: 'Eric Julianto' → 'EricJulianto@12345?.'"]);
    worksheet.addRow(["4. Nama lengkap WAJIB diisi untuk generate password"]);
    worksheet.addRow([`5. Role tersedia: ${roles.join(", ")}`]);
    worksheet.addRow(["6. Email harus format valid (contoh@domain.com)"]);

    // Tambahkan komentar untuk kolom role
    const roleCell = worksheet.getCell("D1");
    roleCell.note = `Role yang tersedia: ${roles.join(", ")}`;

    // Tambahkan komentar untuk kolom full_name dengan password info
    const fullNameCell = worksheet.getCell("C1");
    fullNameCell.note =
      "Password akan dibuat otomatis dari Nama Lengkap dengan pola: NamaLengkapTanpaSpasi@12345?. " +
      "Contoh: 'John Smith' → 'JohnSmith@12345?.' Pastikan nama lengkap tidak kosong!";

    // Set response header
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="user_template.xlsx"'
    );

    // Kirim file sebagai response
    await workbook.xlsx.write(res);
    res.end();

    const ip = getClientIP(req);
    const userAgentData = getUserAgent(req);

    await logUserActivity({
      activity:
        "Downloaded user template (4-column format with auto-generated passwords)",
      actionType: ACTION_TYPES.DOWNLOAD,
      resourceType: RESOURCE_TYPES.FILE,
      resourceId: "user_template.xlsx",
      status: ACTIVITY_STATUS.SUCCESS,
      userId: req.session?.user?.id,
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
        templateType: "user_template",
        format: "xlsx",
        columnsCount: 4,
        passwordGeneration: "auto",
        availableRoles: roles,
        fileSize: "template_only",
      },
      req,
    });
  } catch (err) {
    const ip = getClientIP(req);
    const userAgentData = getUserAgent(req);

    await logUserActivity({
      activity: "Failed to download user template",
      actionType: ACTION_TYPES.DOWNLOAD,
      resourceType: RESOURCE_TYPES.FILE,
      resourceId: "user_template.xlsx",
      status: ACTIVITY_STATUS.FAILURE,
      userId: req.session?.user?.id,
      requestInfo: {
        ip,
        userAgent: userAgentData.userAgent,
        deviceType: userAgentData.deviceType,
        browser: userAgentData.browser,
        platform: userAgentData.platform,
        method: req.method,
        url: req.originalUrl,
      },
      errorMessage: err.message,
      errorCode: err.code || "TEMPLATE_DOWNLOAD_FAILED",
      metadata: {
        templateType: "user_template",
        errorDetails: err.name,
      },
      req,
      level: LOG_LEVELS.ERROR,
    });

    res.status(500).send("Internal Server Error");
  }
};

module.exports = { downloadUserTemplate };
