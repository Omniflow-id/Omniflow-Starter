const { db } = require("@db/db");
const { invalidateCache } = require("@helpers/cache");
const {
  logUserActivity,
  ACTION_TYPES,
  RESOURCE_TYPES,
} = require("@helpers/log");
const { asyncHandler, ValidationError } = require("@middlewares/errorHandler");

/**
 * Delete a permission
 */
const deletePermission = asyncHandler(async (req, res) => {
  const { permissionId } = req.params;

  const [[permission]] = await db.query(
    "SELECT permission_name FROM permissions WHERE permission_id = ? AND deleted_at IS NULL",
    [permissionId]
  );
  if (!permission) {
    throw new ValidationError("Permission not found");
  }

  // Soft delete the permission
  await db.query(
    "UPDATE permissions SET deleted_at = NOW() WHERE permission_id = ?",
    [permissionId]
  );

  await logUserActivity(
    {
      activity: `Deleted permission: ${permission.permission_name}`,
      actionType: ACTION_TYPES.DELETE,
      resourceType: RESOURCE_TYPES.PERMISSION,
      resourceId: permissionId,
    },
    req
  );

  await invalidateCache("permissions:*", true);

  req.flash(
    "success",
    `Permission '${permission.permission_name}' deleted successfully.`
  );
  res.redirect("/admin/permissions");
});

module.exports = { deletePermission };
