const Excel = require("exceljs");
const { db } = require("../../db/db");
const { log, LOG_LEVELS } = require("../../helpers/log");
const UAParser = require("ua-parser-js");
const { getClientIP } = require("../../helpers/getClientIP");

const getLogPage = async (req, res) => {
  try {
    const [allLogs] = await db.query("SELECT * FROM activity_logs");

    const formattedLogs = allLogs.map((log) => {
      const date = new Date(log.created_at);
      const formattedDate = date.toLocaleString("id-ID", {
        weekday: "short",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short",
      });

      return {
        ...log,
        created_at: formattedDate,
      };
    });

    res.render("pages/log/index", { logs: formattedLogs });
  } catch (error) {
    console.error("Error fetching all users:", error);
    res.status(500).send("Internal Server Error");
  }
};

const downloadLogData = async (req, res) => {
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
