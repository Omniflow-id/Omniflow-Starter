// === Third-party modules ===
const bcrypt = require("bcrypt");
const Excel = require("exceljs");

// === Absolute / alias imports ===
const { db } = require("@db/db");
const { invalidateCache } = require("@helpers/cache");
const { getClientIP } = require("@helpers/getClientIP");
const { getUserAgent } = require("@helpers/getUserAgent");
const {
  LOG_LEVELS,
  logUserActivity,
  ACTION_TYPES,
  RESOURCE_TYPES,
  ACTIVITY_STATUS,
} = require("@helpers/log");
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

    const [roles] = await db.query(
      "SELECT role_id, role_name FROM roles WHERE deleted_at IS NULL"
    );
    const roleMap = roles.reduce((map, role) => {
      map[role.role_name] = role.role_id;
      return map;
    }, {});

    worksheet.eachRow((row, rowNumber) => {
      const rowValues = row.values.filter(Boolean);

      if (rowNumber === 1) {
        return;
      }

      if (rowValues.length >= 4) {
        const [name, email, full_name, roleName] = rowValues.map((value) => {
          if (value && typeof value === "object" && value.text) {
            return value.text;
          }
          return value;
        });

        if (name && email && full_name && roleName) {
          const emailRegex = /^[^S@]+@[^S@]+\.[^S@]+$/;
          if (emailRegex.test(email)) {
            // Generate predictable password from full name
            const generatedPassword = generatePredictablePassword(full_name);

            if (generatedPassword) {
              users.push({
                username: name,
                email,
                full_name,
                role_id: roleMap[roleName],
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

      // Individual user creation log (keep simple for bulk operations)
      await logUserActivity({
        activity: `Bulk upload - Created user: ${user.username} (${user.role})`,
        actionType: ACTION_TYPES.CREATE,
        resourceType: RESOURCE_TYPES.USER,
        resourceId: "bulk_upload",
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
          creationMethod: "bulk_upload",
          newUser: {
            username: user.username,
            email: user.email,
            role: user.role,
          },
          passwordGenerated: true,
          uploadedBy: req.session.user.username,
        },
        req,
      });
    }

    // Handle results and show password list
    if (successfulUsers.length > 0) {
      // Invalidate user-related caches after bulk creation
      await invalidateCache("admin:users:*", true);
      await invalidateCache("user:*", true);

      // Log bulk upload summary
      await logUserActivity({
        activity: `Bulk upload completed - ${successfulUsers.length} users created successfully`,
        actionType: ACTION_TYPES.IMPORT,
        resourceType: RESOURCE_TYPES.USER,
        resourceId: "bulk_upload_summary",
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
          uploadSummary: {
            totalAttempted: users.length,
            successfullyCreated: successfulUsers.length,
            duplicatesSkipped: duplicateEmails.length,
            duplicateEmails: duplicateEmails,
          },
          fileInfo: {
            originalName: req.file?.originalname,
            fileSize: req.file?.size,
            mimeType: req.file?.mimetype,
          },
          uploadedBy: req.session.user.username,
          passwordGeneration: "auto_from_fullname",
        },
        req,
      });

      // Store generated passwords in session for display
      req.session.generatedPasswords = successfulUsers;

      if (duplicateEmails.length > 0) {
        req.flash(
          "success",
          `${
            successfulUsers.length
          } users created successfully! Some duplicate emails were skipped: ${duplicateEmails.join(
            ", "
          )}`
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
          ? `All users skipped due to duplicate emails: ${duplicateEmails.join(
              ", "
            )}`
          : "No users were created"
      );
    }

    return res.redirect("/admin/user/index");
  } catch (err) {
    await logUserActivity({
      activity: "Failed to process bulk user upload",
      actionType: ACTION_TYPES.IMPORT,
      resourceType: RESOURCE_TYPES.USER,
      resourceId: "bulk_upload_failed",
      status: ACTIVITY_STATUS.FAILURE,
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
      errorMessage: err.message,
      errorCode: err.code || "BULK_UPLOAD_FAILED",
      metadata: {
        fileInfo: {
          originalName: req.file?.originalname,
          fileSize: req.file?.size,
          mimeType: req.file?.mimetype,
        },
        uploadedBy: req.session.user.username,
        errorDetails: err.name,
      },
      req,
      level: LOG_LEVELS.ERROR,
    });

    req.flash(
      "error",
      `An error occurred while processing the file: ${err.message}`
    );
    return res.redirect("/admin/user/index");
  }
};

module.exports = { uploadNewUser };
