const {
  logUserActivity,
  ACTION_TYPES,
  RESOURCE_TYPES,
  ACTIVITY_STATUS,
} = require("@helpers/log");
const { getClientIP } = require("@helpers/getClientIP");
const { getUserAgent } = require("@helpers/getUserAgent");

const logout = async (req, res) => {
  const user = req.session.user;

  if (user) {
    // Log logout activity
    const clientIP = getClientIP(req);
    const userAgent = getUserAgent(req);

    await logUserActivity({
      activity: `User logged out: ${user.username}`,
      actionType: ACTION_TYPES.LOGOUT,
      resourceType: RESOURCE_TYPES.SESSION,
      resourceId: req.session.id,
      status: ACTIVITY_STATUS.SUCCESS,
      userId: user.id,
      userInfo: {
        username: user.username,
        email: user.email,
        role: user.role,
      },
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
        logoutMethod: "manual",
        sessionId: req.session.id,
      },
      req,
    });
  }

  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
    }
    res.redirect("/admin/login");
  });
};

module.exports = {
  logout,
};
