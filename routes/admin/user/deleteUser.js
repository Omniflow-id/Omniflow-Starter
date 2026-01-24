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

/**
 * Soft delete a user
 */
const deleteUser = async (req, res) => {
    const userId = req.params.id;

    try {
        // Prevent self-deletion
        if (parseInt(userId, 10) === req.session.user.id) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete your own account",
            });
        }

        // Check if user exists
        const [users] = await db.query(
            "SELECT id, username, email FROM users WHERE id = ? AND deleted_at IS NULL",
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const targetUser = users[0];
        const now = new Date().toISOString().slice(0, 19).replace("T", " ");

        // Soft delete the user
        await db.query(
            "UPDATE users SET deleted_at = NOW(), is_active = 0, updated_at = ? WHERE id = ?",
            [now, userId]
        );

        // Log activity
        const clientIP = getClientIP(req);
        const userAgent = getUserAgent(req);

        await logUserActivity({
            activity: `Deleted user: ${targetUser.username}`,
            actionType: ACTION_TYPES.DELETE,
            resourceType: RESOURCE_TYPES.USER,
            resourceId: userId,
            status: ACTIVITY_STATUS.SUCCESS,
            userId: req.session.user.id,
            requestInfo: {
                ip: clientIP,
                userAgent: userAgent.userAgent,
                deviceType: userAgent.deviceType,
                browser: userAgent.browser,
                platform: userAgent.platform,
                method: req.method,
                url: req.originalUrl,
            },
            metadata: {
                deletedUser: {
                    username: targetUser.username,
                    email: targetUser.email,
                },
                deletionType: "soft_delete",
            },
            req,
            level: LOG_LEVELS.WARN,
        });

        // Invalidate caches
        await invalidateCache("admin:users:*", true);
        await invalidateCache("datatable:users:*", true);
        await invalidateCache(`user:${userId}:*`, true);

        res.json({
            success: true,
            message: `User ${targetUser.username} deleted successfully`,
        });
    } catch (error) {
        console.error("❌ [USER-DELETE] Error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to delete user",
            error: error.message,
        });
    }
};

module.exports = { deleteUser };
