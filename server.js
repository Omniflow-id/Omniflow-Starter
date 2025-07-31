// === Side-effect imports (HARUS PALING ATAS) ===
require("module-alias/register");

// === Core modules ===
const http = require("node:http");

// === Relative imports ===
const app = require("./app");
const config = require("./config");

const PORT = config.app.port;
const server = http.createServer(app);

const start = () => {
  try {
    server.listen(PORT, () => {
      console.log(`🚀 [SERVER] is running on port http://localhost:${PORT}`);
    });
  } catch (error) {
    console.log(`⚠️ [ERROR], ${error}`);
  }
};

start();
