const { db } = require("@db/db");
const { invalidateCache } = require("@helpers/cache");
const {
  logUserActivity,
  ACTION_TYPES,
  RESOURCE_TYPES,
} = require("@helpers/log");
const { asyncHandler, ValidationError } = require("@middlewares/errorHandler");

/**
 * Create a new role
 */
const createRole = asyncHandler(async (req, res) => {
  const { role_name, description } = req.body;

  if (!role_name) {
    throw new ValidationError("Role name is required");
  }

  const [existingRole] = await db.query(
    "SELECT role_id FROM roles WHERE role_name = ? AND deleted_at IS NULL",
    [role_name]
  );
  if (existingRole.length > 0) {
    throw new ValidationError("Role with this name already exists");
  }

  const [result] = await db.query(
    "INSERT INTO roles (role_name, description) VALUES (?, ?)",
    [role_name, description]
  );
  const newRoleId = result.insertId;

  await logUserActivity(
    {
      activity: `Created new role: ${role_name}`,
      actionType: ACTION_TYPES.CREATE,
      resourceType: RESOURCE_TYPES.ROLE,
      resourceId: newRoleId,
      dataChanges: { after: { role_name, description } },
    },
    req
  );

  await invalidateCache("permissions:*", true);

  req.flash("success", `Role '${role_name}' created successfully.`);
  res.redirect("/admin/roles");
});

module.exports = { createRole };
