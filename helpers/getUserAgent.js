const UAParser = require("ua-parser-js");

const getUserAgent = (req) => {
  const parser = new UAParser(req.headers["user-agent"]);
  const result = parser.getResult();

  return {
    deviceType:
      result.device.type || (result.device.vendor ? "Mobile" : "Desktop"),
    browser: `${result.browser.name} ${result.browser.version}`,
    platform: `${result.os.name} ${result.os.version}`,
  };
};

module.exports = { getUserAgent };
