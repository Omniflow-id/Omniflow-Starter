// === Third-party modules ===
const bcrypt = require("bcrypt");
const Excel = require("exceljs");

// === Absolute / alias imports ===
const { db } = require("@db/db");
const { getClientIP } = require("@helpers/getClientIP");
const { getUserAgent } = require("@helpers/getUserAgent");
const { log, LOG_LEVELS } = require("@helpers/log");
const { generatePredictablePassword } = require("@helpers/passwordPolicy");

const uploadNewUser = async (req, res) => {
  const ip = getClientIP(req);
  const userAgentData = getUserAgent(req);

  if (!req.file) {
    req.flash("error", "File upload is required");
    return res.redirect("/admin/user/index");
  }

  try {
    const workbook = new Excel.Workbook();
    // Read from memory buffer instead of file path
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      req.flash("error", "Invalid file format. Worksheet not found.");
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
    return res.redirect("/admin/user/index");
  }
};

module.exports = { uploadNewUser };