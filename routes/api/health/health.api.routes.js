const express = require("express");
const router = express.Router();

const {
  getHealthAPI,
  getHealthDetailedAPI,
  getHealthLivezAPI,
  getHealthReadyzAPI,
  getHealthStartupAPI,
} = require("./health.api.controller");

// Main health check endpoint - comprehensive status
router.get("/", getHealthAPI);

// Detailed health check with extended information
router.get("/detailed", getHealthDetailedAPI);

// Kubernetes-style probes
router.get("/livez", getHealthLivezAPI); // Liveness probe
router.get("/readyz", getHealthReadyzAPI); // Readiness probe
router.get("/startup", getHealthStartupAPI); // Startup probe

module.exports = router;
