// === Third-party modules ===
const Excel = require("exceljs");

// === Absolute / alias imports ===
const { db } = require("@db/db");
const { getClientIP } = require("@helpers/getClientIP");
const { getUserAgent } = require("@helpers/getUserAgent");
const { log, LOG_LEVELS } = require("@helpers/log");

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

    await log(
      `${req.session.user.username} DOWNLOADED USER data`,
      LOG_LEVELS.INFO,
      req.session.user.id,
      userAgentData,
      ip
    );

    res.end();
  } catch (error) {
    const clientIP = getClientIP(req);
    const userAgent = getUserAgent(req);

    await log(
      `Kesalahan saat mengunduh data user: ${error.message}`,
      LOG_LEVELS.ERROR,
      req.session?.user?.id,
      userAgent,
      clientIP
    );

    res.status(500).send("Internal Server Error");
  }
};

module.exports = { downloadUserData };