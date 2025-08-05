const { db } = require("@db/db");
const { invalidateCache } = require("@helpers/cache");
const {
  logUserActivity,
  ACTION_TYPES,
  RESOURCE_TYPES,
} = require("@helpers/log");
const { asyncHandler, ValidationError } = require("@middlewares/errorHandler");

/**
 * Delete a role
 */
const deleteRole = asyncHandler(async (req, res) => {
  const { roleId } = req.params;

  const [[role]] = await db.query(
    "SELECT role_name FROM roles WHERE role_id = ? AND deleted_at IS NULL",
    [roleId]
  );
  if (!role) {
    throw new ValidationError("Role not found");
  }

  // Soft delete the role
  await db.query("UPDATE roles SET deleted_at = NOW() WHERE role_id = ?", [
    roleId,
  ]);

  await logUserActivity(
    {
      activity: `Deleted role: ${role.role_name}`,
      actionType: ACTION_TYPES.DELETE,
      resourceType: RESOURCE_TYPES.ROLE,
      resourceId: roleId,
    },
    req
  );

  await invalidateCache("admin:permissions:*", true);

  req.flash("success", `Role '${role.role_name}' deleted successfully.`);
  res.redirect("/admin/roles");
});

module.exports = { deleteRole };
