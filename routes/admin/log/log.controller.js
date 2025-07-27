const Excel = require("exceljs");
const { db } = require("../../../db/db");

const getLogPage = async (_req, res) => {
  try {
    const [allLogs] = await db.query("SELECT * FROM activity_logs");

    // No need to format dates here - let the template handle it with Jakarta timezone
    res.render("pages/admin/log/index", { logs: allLogs });
  } catch (error) {
    console.error("Error fetching all users:", error);
    res.status(500).send("Internal Server Error");
  }
};

const downloadLogData = async (_req, res) => {
  try {
    const [logs] = await db.query(`
            SELECT id, user_id, activity, ip_address, device_type, browser, platform, created_at
            FROM activity_logs
            ORDER by created_at
        `);

    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("Logs");

    worksheet.columns = [
      { header: "UserID", key: "user_id", width: 10 },
      { header: "Aktivitas", key: "activity", width: 30 },
      { header: "Alamat IP", key: "ip_address", width: 15 },
      { header: "Device Type", key: "device_type", width: 15 },
      { header: "Browser", key: "browser", width: 20 },
      { header: "Platform", key: "platform", width: 15 },
      { header: "Waktu", key: "created_at", width: 15 },
    ];

    // Style untuk header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    worksheet.addRows(logs);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=logs-data.xlsx");

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
