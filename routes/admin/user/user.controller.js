// === Core modules ===
const fs = require("node:fs");

// === Third-party modules ===
const bcrypt = require("bcrypt");
const Excel = require("exceljs");

// === Absolute / alias imports ===
const { db } = require("@db/db");
const { getClientIP } = require("@helpers/getClientIP");
const { getUserAgent } = require("@helpers/getUserAgent");
const { log, LOG_LEVELS } = require("@helpers/log");
const {
  generatePredictablePassword,
  validatePassword,
} = require("@helpers/passwordPolicy");

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

    res.render("pages/admin/user/overview", {
      totalUsers: totalUsers[0].total,
      roleStats,
    });
  } catch (error) {
    const clientIP = getClientIP(req);
    const userAgent = getUserAgent(req);

    await log(
      `Kesalahan saat mengambil statistik user: ${error.message}`,
      LOG_LEVELS.ERROR,
      req.session?.user?.id,
      userAgent,
      clientIP
    );

    res.status(500).send("Internal Server Error");
  }
};

const getAllUsersPage = async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT id, username, email, full_name, role, is_active FROM users ORDER BY id"
    );

    // Add session user ID to prevent self-deactivation
    const usersWithSessionInfo = users.map((user) => ({
      ...user,
      session_user_id: req.session.user.id,
    }));

    res.render("pages/admin/user/index", { users: usersWithSessionInfo });
  } catch (error) {
    const clientIP = getClientIP(req);
    const userAgent = getUserAgent(req);

    await log(
      `Kesalahan saat mengambil daftar user: ${error.message}`,
      LOG_LEVELS.ERROR,
      req.session?.user?.id,
      userAgent,
      clientIP
    );

    res.status(500).send("Internal Server Error");
  }
};

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

const uploadNewUser = async (req, res) => {
  const ip = getClientIP(req);
  const userAgentData = getUserAgent(req);

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
      return res.redirect("/admin/user/index");
    }

    const users = [];
    const duplicateEmails = [];

    worksheet.eachRow((row, rowNumber) => {
      const rowValues = row.values.filter(Boolean);

      if (rowNumber === 1) {
        return;
      }

      if (rowValues.length >= 4) {
        const [name, email, full_name, role] = rowValues.map((value) => {
          if (value && typeof value === "object" && value.text) {
            return value.text;
          }
          return value;
        });

        if (name && email && full_name && role) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (emailRegex.test(email)) {
            // Generate predictable password from full name
            const generatedPassword = generatePredictablePassword(full_name);

            if (generatedPassword) {
              users.push({
                username: name,
                email,
                full_name,
                role,
                password: generatedPassword,
              });
            }
          }
        }
      }
    });

    if (users.length === 0) {
      req.flash("error", "No valid data found in the uploaded file.");
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
      return res.redirect("/admin/user/index");
    }

    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    const successfulUsers = [];

    for (const user of users) {
      const [existingUser] = await db.query(
        "SELECT id FROM users WHERE email = ?",
        [user.email]
      );

      if (existingUser.length > 0) {
        duplicateEmails.push(user.email);
        continue;
      }

      const hashedPassword = await bcrypt.hash(user.password, 10);
      await db.query(
        "INSERT INTO users (username, email, full_name, role, password_hash, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          user.username,
          user.email,
          user.full_name,
          user.role,
          hashedPassword,
          true,
          now,
          now,
        ]
      );

      // Store successful user with generated password for display
      successfulUsers.push({
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        generatedPassword: user.password,
      });

      await log(
        `User ${user.username} - ${user.role} created with generated password by ${req.session.user.username}`,
        LOG_LEVELS.INFO,
        req.session.user.id,
        userAgentData,
        ip
      );
    }

    // Handle results and show password list
    if (successfulUsers.length > 0) {
      // Store generated passwords in session for display
      req.session.generatedPasswords = successfulUsers;

      if (duplicateEmails.length > 0) {
        req.flash(
          "success",
          `${successfulUsers.length} users created successfully! Some duplicate emails were skipped: ${duplicateEmails.join(", ")}`
        );
      } else {
        req.flash(
          "success",
          `${successfulUsers.length} users created successfully! Generated passwords are shown below.`
        );
      }

      // Redirect to password display page
      return res.redirect("/admin/user/passwords");
    } else {
      req.flash(
        "error",
        duplicateEmails.length > 0
          ? `All users skipped due to duplicate emails: ${duplicateEmails.join(", ")}`
          : "No users were created"
      );
    }

    fs.unlink(filePath, (err) => {
      if (err) console.error("Error deleting file:", err);
    });
    return res.redirect("/admin/user/index");
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
    return res.redirect("/admin/user/index");
  }
};

const showGeneratedPasswordsPage = (req, res) => {
  const generatedPasswords = req.session.generatedPasswords;

  if (!generatedPasswords || generatedPasswords.length === 0) {
    req.flash("error", "No generated passwords to display");
    return res.redirect("/admin/user/index");
  }

  // Clear passwords from session after displaying (security)
  delete req.session.generatedPasswords;

  res.render("pages/admin/user/passwords", {
    generatedPasswords,
    title: "Generated Passwords",
  });
};

const createNewUser = async (req, res) => {
  const { username, email, full_name, role } = req.body;

  const ip = getClientIP(req);
  const userAgentData = getUserAgent(req);

  try {
    // Input validation
    if (!username || !email || !full_name || !role) {
      req.flash("error", "All fields are required");
      return res.redirect("/admin/user/index");
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      req.flash("error", "Please provide a valid email address");
      return res.redirect("/admin/user/index");
    }

    // Role validation
    const validRoles = ["Admin", "Manager", "User"];
    if (!validRoles.includes(role)) {
      await log(
        `Invalid role "${role}" selected by ${req.session.user.username}`,
        LOG_LEVELS.WARN,
        req.session.user.id,
        userAgentData,
        ip
      );
      req.flash("error", "Invalid role selected");
      return res.redirect("/admin/user/index");
    }

    // Generate predictable password from full name
    const generatedPassword = generatePredictablePassword(full_name);
    if (!generatedPassword) {
      req.flash("error", "Could not generate password from full name");
      return res.redirect("/admin/user/index");
    }

    // Validate generated password against policy (skip email/username checks for generated passwords)
    const passwordValidation = validatePassword(generatedPassword);

    if (!passwordValidation.isValid) {
      await log(
        `Generated password failed validation for user ${username}: ${passwordValidation.errors.join(", ")}`,
        LOG_LEVELS.ERROR,
        req.session.user.id,
        userAgentData,
        ip
      );
      req.flash(
        "error",
        "Generated password does not meet security requirements"
      );
      return res.redirect("/admin/user/index");
    }

    const hashedPassword = await bcrypt.hash(generatedPassword, 10);
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    // Check if email exists
    const [existingUser] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      await log(
        `Failed to create user - email ${email} already exists (attempted by ${req.session.user.username})`,
        LOG_LEVELS.WARN,
        req.session.user.id,
        userAgentData,
        ip
      );
      req.flash("error", "Email already exists!");
      return res.redirect("/admin/user/index");
    }

    await db.query(
      "INSERT INTO users (username, email, full_name, role, password_hash, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [username, email, full_name, role, hashedPassword, true, now, now]
    );

    await log(
      `User ${username} (${role}) created with generated password by ${req.session.user.username}`,
      LOG_LEVELS.INFO,
      req.session.user.id,
      userAgentData,
      ip
    );

    // Store generated password for display
    req.session.singleUserPassword = {
      username: username,
      email: email,
      full_name: full_name,
      role: role,
      generatedPassword: generatedPassword,
    };

    req.flash(
      "success",
      `User created successfully! Generated password: ${generatedPassword}`
    );
    res.redirect("/admin/user/index");
  } catch (err) {
    await log(
      `Failed to create user ${username}: ${err.message} (by ${req.session.user.username})`,
      LOG_LEVELS.ERROR,
      req.session.user.id,
      userAgentData,
      ip
    );
    req.flash("error", `Error creating user: ${err.message}`);
    res.redirect("/admin/user/index");
  }
};

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

    await log(
      `User ${req.session?.user?.username} downloaded user template (4-column format with auto-generated passwords)`,
      LOG_LEVELS.INFO,
      req.session?.user?.id,
      userAgentData,
      ip
    );
  } catch (err) {
    const ip = getClientIP(req);
    const userAgentData = getUserAgent(req);

    await log(
      `Kesalahan saat mengunduh template user: ${err.message}`,
      LOG_LEVELS.ERROR,
      req.session?.user?.id,
      userAgentData,
      ip
    );

    res.status(500).send("Internal Server Error");
  }
};

const toggleUserActive = async (req, res) => {
  const userId = req.params.id;

  const ip = getClientIP(req);
  const userAgentData = getUserAgent(req);

  try {
    // Check if trying to deactivate own account
    if (parseInt(userId) === req.session.user.id) {
      req.flash("error", "Cannot deactivate your own account");
      return res.redirect("/admin/user/index");
    }

    // Get current user status
    const [users] = await db.query(
      "SELECT username, is_active FROM users WHERE id = ?",
      [userId]
    );

    if (users.length === 0) {
      req.flash("error", "User not found");
      return res.redirect("/admin/user/index");
    }

    const targetUser = users[0];
    const newStatus = !targetUser.is_active;

    // Update user status
    await db.query("UPDATE users SET is_active = ? WHERE id = ?", [
      newStatus,
      userId,
    ]);

    await log(
      `User ${targetUser.username} ${newStatus ? "activated" : "deactivated"} by ${req.session.user.username}`,
      LOG_LEVELS.INFO,
      req.session.user.id,
      userAgentData,
      ip
    );

    req.flash(
      "success",
      `User ${targetUser.username} has been ${newStatus ? "activated" : "deactivated"} successfully`
    );
    res.redirect("/admin/user/index");
  } catch (error) {
    await log(
      `Error toggling user active status: ${error.message}`,
      LOG_LEVELS.ERROR,
      req.session.user.id,
      userAgentData,
      ip
    );
    req.flash("error", "An error occurred while updating user status");
    res.redirect("/admin/user/index");
  }
};

module.exports = {
  getAllUsersPage,
  getUserOverviewPage,
  downloadUserData,
  uploadNewUser,
  createNewUser,
  downloadUserTemplate,
  showGeneratedPasswordsPage,
  toggleUserActive,
};
