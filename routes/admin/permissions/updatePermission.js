const { db } = require("@db/db");
const { invalidateCache } = require("@helpers/cache");
const {
  logUserActivity,
  ACTION_TYPES,
  RESOURCE_TYPES,
} = require("@helpers/log");
const { asyncHandler, ValidationError } = require("@middlewares/errorHandler");

/**
 * Update an existing permission
 */
const updatePermission = asyncHandler(async (req, res) => {
  const { permissionId } = req.params;
  const { permission_name, description } = req.body;

  if (!permission_name) {
    throw new ValidationError("Permission name is required");
  }

  const [[permissionBefore]] = await db.query(
    "SELECT * FROM permissions WHERE permission_id = ? AND deleted_at IS NULL",
    [permissionId]
  );
  if (!permissionBefore) {
    throw new ValidationError("Permission not found");
  }

  await db.query(
    "UPDATE permissions SET permission_name = ?, description = ? WHERE permission_id = ?",
    [permission_name, description, permissionId]
  );

  await logUserActivity(
    {
      activity: `Updated permission: ${permission_name}`,
      actionType: ACTION_TYPES.UPDATE,
      resourceType: RESOURCE_TYPES.PERMISSION,
      resourceId: permissionId,
      dataChanges: {
        before: permissionBefore,
        after: { permission_name, description },
      },
    },
    req
  );

  await invalidateCache("permissions:*", true);

  req.flash("success", `Permission '${permission_name}' updated successfully.`);
  res.redirect("/admin/permissions");
});

module.exports = { updatePermission };
