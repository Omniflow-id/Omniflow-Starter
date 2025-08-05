const { db } = require("@db/db");
const { invalidateCache } = require("@helpers/cache");
const {
  logUserActivity,
  ACTION_TYPES,
  RESOURCE_TYPES,
} = require("@helpers/log");
const { asyncHandler, ValidationError } = require("@middlewares/errorHandler");

/**
 * Update an existing role
 */
const updateRole = asyncHandler(async (req, res) => {
  const { roleId } = req.params;
  const { role_name, description } = req.body;

  if (!role_name) {
    throw new ValidationError("Role name is required");
  }

  const [[roleBefore]] = await db.query(
    "SELECT * FROM roles WHERE role_id = ? AND deleted_at IS NULL",
    [roleId]
  );
  if (!roleBefore) {
    throw new ValidationError("Role not found");
  }

  await db.query(
    "UPDATE roles SET role_name = ?, description = ? WHERE role_id = ?",
    [role_name, description, roleId]
  );

  await logUserActivity(
    {
      activity: `Updated role: ${role_name}`,
      actionType: ACTION_TYPES.UPDATE,
      resourceType: RESOURCE_TYPES.ROLE,
      resourceId: roleId,
      dataChanges: { before: roleBefore, after: { role_name, description } },
    },
    req
  );

  await invalidateCache("admin:permissions:*", true);

  req.flash("success", `Role '${role_name}' updated successfully.`);
  res.redirect("/admin/roles");
});

module.exports = { updateRole };
