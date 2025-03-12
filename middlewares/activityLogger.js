const { log, LOG_LEVELS } = require("../helpers/log");
const UAParser = require("ua-parser-js");
const { getClientIP } = require("../helpers/getClientIP");

/**
 * Middleware to log user activities
 * @param {string} activity - Activity description to log
 * @param {string} level - Log level (INFO, WARN, ERROR) from LOG_LEVELS
 * @returns {function} Express middleware function
 */
const activityLogger = (activity, level = LOG_LEVELS.INFO) => {
  return async (req, res, next) => {
    // Extract request information
    const ip = getClientIP(req);
    const parser = new UAParser(req.headers["user-agent"]);
    const userAgentData = (() => {
      const result = parser.getResult();
      return {
        deviceType:
          result.device.type || (result.device.vendor ? "Mobile" : "Desktop"),
        browser: `${result.browser.name} ${result.browser.version}`,
        platform: `${result.os.name} ${result.os.version}`,
      };
    })();

    // Get user ID if user is logged in
    const user_id = req.session?.user?.id || null;
    
    // Replace placeholders in activity message if provided
    let activityMessage = activity;
    if (typeof activity === 'string') {
      // Replace placeholders with actual values
      activityMessage = activity.replace(/\{([^}]+)\}/g, (match, key) => {
        // Extract nested properties using path notation (e.g., "user.name")
        const path = key.split('.');
        let value = req;
        
        for (const segment of path) {
          if (value && typeof value === 'object' && segment in value) {
            value = value[segment];
          } else {
            return match; // Keep original placeholder if path not found
          }
        }
        
        return typeof value !== 'undefined' ? value : match;
      });
    }

    try {
      // Log the activity
      await log(
        activityMessage,
        level,
        user_id,
        userAgentData,
        ip
      );
    } catch (err) {
      console.error("Activity logging error:", err);
      // Continue with request even if logging fails
    }

    // Continue with the request
    next();
  };
};

/**
 * Middleware factory to generate common activity loggers
 */
const activityLoggers = {
  // Page view logger
  pageView: (page) => activityLogger(`Page viewed: ${page}`, LOG_LEVELS.INFO),
  
  // Data access logger
  dataAccess: (resource) => activityLogger(`Accessed data: ${resource}`, LOG_LEVELS.INFO),
  
  // Data modification logger
  dataModification: (resource) => activityLogger(`Modified data: ${resource}`, LOG_LEVELS.INFO),
  
  // Error logger
  error: (error) => activityLogger(`Error occurred: ${error}`, LOG_LEVELS.ERROR),
  
  // Custom logger with dynamic message from request
  custom: (messageFn, level = LOG_LEVELS.INFO) => {
    return async (req, res, next) => {
      const message = typeof messageFn === 'function' 
        ? messageFn(req, res) 
        : messageFn;
      
      const middleware = activityLogger(message, level);
      await middleware(req, res, next);
    };
  }
};

module.exports = { activityLogger, activityLoggers, LOG_LEVELS };
