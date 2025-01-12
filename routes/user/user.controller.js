const Excel = require("exceljs");
const { db } = require("../../db/db");
const bcrypt = require("bcrypt");
const { log, LOG_LEVELS } = require("../../helpers/log");
const UAParser = require("ua-parser-js");
const { getClientIP } = require("../../helpers/getClientIP");
const fs = require("fs");
const path = require("path");

const getUserOverviewPage = async (req, res) => {
  try {
    // Get total users
    const [totalUsers] = await db.query("SELECT COUNT(*) as total FROM users");

    // Get count of users by role
    const [roleStats] = await db.query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role
    `);

    res.render("pages/user/overview", {
      totalUsers: totalUsers[0].total,
      roleStats,
    });
  } catch (error) {
    console.error("Error fetching user statistics:", error);
    res.status(500).send("Internal Server Error");
  }
};

const getAllUsersPage = async (req, res) => {
  try {
    const [users] = await db.query("SELECT * FROM users");
    res.render("pages/user/index", { users });
  } catch (error) {
    console.error("Error fetching all users:", error);
    res.status(500).send("Internal Server Error");
  }
};

const downloadUserData = async (req, res) => {
  try {
    // Query database untuk mendapatkan semua user
    const [users] = await db.query(`
      SELECT id, username, email, role
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
      { header: "Role", key: "role", width: 15 },
    ];

    // Style untuk header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    // Tambahkan data
    worksheet.addRows(users);

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
    const parser = new UAParser(req.headers["user-agent"]);
    const result = parser.getResult();

    const userAgentData = {
      deviceType:
        result.device.type || (result.device.vendor ? "Mobile" : "Desktop"),
      browser: `${result.browser.name} ${result.browser.version}`,
      platform: `${result.os.name} ${result.os.version}`,
    };

    await log(
      `${req.session.user.username} DOWNLOADED USER data`,
      LOG_LEVELS.INFO,
      req.session.user.id,
      userAgentData,
      ip
    );

    res.end();
  } catch (error) {
    console.error("Error downloading user data:", error);
    res.status(500).send("Internal Server Error");
  }
};

const uploadNewUser = async (req, res) => {
  const ip = getClientIP(req);
  const parser = new UAParser(req.headers["user-agent"]);
  const userAgentData = (() => {
    const result = parser.getResult();
    return {
      deviceType:
        result.device.type || (result.device.vendor ? "Mobile" : "Desktop"),
      browser: `${result.browser.name} ${result.browser.version}`,
      platform: `${result.os.name} ${result.os.version}`,
    };
  })();

  if (!req.file) {
    req.flash("error", "File upload is required");
    return res.redirect("/user/index");
  }

  const filePath = req.file.path;

  try {
    const workbook = new Excel.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      req.flash("error", "Invalid file format. Worksheet not found.");
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
      return res.redirect("/user/index");
    }

    const users = [];
    const duplicateEmails = [];

    worksheet.eachRow((row, rowNumber) => {
      const rowValues = row.values.filter(Boolean);

      if (rowNumber === 1) {
        return;
      }

      if (rowValues.length >= 4) {
        const [name, email, role, password] = rowValues.map((value) => {
          if (value && typeof value === "object" && value.text) {
            return value.text;
          }
          return value;
        });

        if (name && email && role && password) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (emailRegex.test(email)) {
            users.push({
              username: name,
              email,
              role,
              password,
            });
          }
        }
      }
    });

    if (users.length === 0) {
      req.flash("error", "No valid data found in the uploaded file.");
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
      return res.redirect("/user/index");
    }

    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    for (const user of users) {
      const existingUser = await db.query(
        "SELECT id FROM users WHERE email = ?",
        [user.email]
      );

      if (existingUser.length > 0) {
        duplicateEmails.push(user.email);
        continue;
      }

      const hashedPassword = await bcrypt.hash(user.password, 10);
      await db.query(
        "INSERT INTO users (username, email, role, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        [user.username, user.email, user.role, hashedPassword, now, now]
      );

      await log(
        `User ${user.username} - ${user.role} created by ${req.session.user.username}`,
        LOG_LEVELS.INFO,
        req.session.user.id,
        userAgentData,
        ip
      );
    }

    if (duplicateEmails.length > 0) {
      req.flash(
        "error",
        `Duplicate emails found: ${duplicateEmails.join(
          ", "
        )}. User creation skipped for these.`
      );
    } else {
      req.flash("success", "Data user baru sudah di-upload!");
    }

    fs.unlink(filePath, (err) => {
      if (err) console.error("Error deleting file:", err);
    });
    return res.redirect("/user/index");
  } catch (err) {
    await log(
      `Error creating users from Excel: ${err.message}`,
      LOG_LEVELS.ERROR,
      req.session.user.id,
      userAgentData,
      ip
    );
    req.flash(
      "error",
      `An error occurred while processing the file: ${err.message}`
    );
    fs.unlink(filePath, (err) => {
      if (err) console.error("Error deleting file:", err);
    });
    return res.redirect("/user/index");
  }
};

const createNewUser = async (req, res) => {
  const { username, email, role } = req.body;

  const ip = getClientIP(req);
  const parser = new UAParser(req.headers["user-agent"]);
  const userAgentData = (() => {
    const result = parser.getResult();
    return {
      deviceType:
        result.device.type || (result.device.vendor ? "Mobile" : "Desktop"),
      browser: `${result.browser.name} ${result.browser.version}`,
      platform: `${result.os.name} ${result.os.version}`,
    };
  })();

  try {
    // Set password based on role
    let password;
    switch (role) {
      case "Admin":
        password = "Admin12345.";
        break;
      case "Manager":
        password = "Manager1234.";
        break;
      case "User":
        password = "User12345.";
        break;
      default:
        await log(
          `Invalid role selected by ${req.session.user.username}`,
          LOG_LEVELS.WARN,
          req.session.user.id,
          userAgentData,
          ip
        );
        req.flash("error", "Invalid role selected");
        return res.redirect("/user/index");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    // Check if email exists
    const [existingUser] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      await log(
        `Gagal membuat user baru dengan email ${username} karena sudah ada data yang sama oleh: ${req.session.user.username}`,
        LOG_LEVELS.WARN,
        req.session.user.id,
        userAgentData,
        ip
      );
      req.flash("error", "Email sudah ada!");
      return res.redirect("/user/index");
    }

    await db.query(
      "INSERT INTO users (username, email, role, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      [username, email, role, hashedPassword, now, now]
    );

    await log(
      `User baru dengan username ${username} telah dibuat oleh ${req.session.user.username}`,
      LOG_LEVELS.INFO,
      req.session.user.id,
      userAgentData,
      ip
    );

    req.flash("success", "User created successfully");
    res.redirect("/user/index");
  } catch (err) {
    await log(
      `${req.session.user.username} gagal membuat user baru untuk username ${username}: ${err.message}`,
      LOG_LEVELS.ERROR,
      req.session.user.id,
      userAgentData,
      ip
    );
    req.flash("error", "Error creating user");
    res.redirect("/user/index");
  }
};

const downloadUserTemplate = (req, res) => {
  try {
    // Path lengkap ke file template
    const filePath = path.join(__dirname, "../../templates/data/user.xlsx");

    // Mengatur header untuk download file
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="user_template.xlsx"'
    );

    // Kirim file sebagai response
    res.sendFile(filePath);
  } catch (err) {
    console.error("Error downloading user template:", err);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  getAllUsersPage,
  getUserOverviewPage,
  downloadUserData,
  uploadNewUser,
  createNewUser,
  downloadUserTemplate,
};
