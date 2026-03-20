const { db } = require("@db/db");
const { invalidateCache } = require("@helpers/cache");
const {
  logUserActivity,
  ACTION_TYPES,
  RESOURCE_TYPES,
} = require("@helpers/log");
const { asyncHandler, ValidationError } = require("@middlewares/errorHandler");

/**
 * Create a new permission
 */
const createPermission = asyncHandler(async (req, res) => {
  const { permission_name, description } = req.body;

  if (!permission_name) {
    throw new ValidationError(res.locals.t("common.errors.permissionNameRequired"));
  }

  const [existingPermission] = await db.query(
    "SELECT permission_id FROM permissions WHERE permission_name = ? AND deleted_at IS NULL",
    [permission_name]
  );
  if (existingPermission.length > 0) {
    throw new ValidationError(res.locals.t("common.errors.permissionExists"));
  }

  const [result] = await db.query(
    "INSERT INTO permissions (permission_name, description) VALUES (?, ?)",
    [permission_name, description]
  );
  const newPermissionId = result.insertId;

  await logUserActivity(
    {
      activity: `Created new permission: ${permission_name}`,
      actionType: ACTION_TYPES.CREATE,
      resourceType: RESOURCE_TYPES.PERMISSION,
      resourceId: newPermissionId,
      dataChanges: { after: { permission_name, description } },
    },
    req
  );

  await invalidateCache("permissions:*", true);

  req.flash("success", "common.messages.permissionCreated");
  res.redirect("/admin/permissions");
});

module.exports = { createPermission };
