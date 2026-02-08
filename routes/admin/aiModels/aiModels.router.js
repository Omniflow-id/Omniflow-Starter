const express = require("express");
const router = express.Router();
// const { doubleCsrfProtection } = require("@middlewares/csrfProtection");
const { checkPermission } = require("@middlewares/checkPermission");
const { withLocale } = require("@helpers/i18n");

const aiModels = require("./aiModels.controller");

// Page routes
router.get(
  "/",
  withLocale("admin/ai"),
  checkPermission("manage_ai_models"),
  aiModels.getAIModelsPage
);

// API routes
router.get("/api/ai_models", aiModels.getAllAIModels);
router.get("/all", aiModels.getAllAIModelsAPI);

// CRUD routes with CSRF protection (Handled globally or relaxed for now)
router.post(
  "/create",
  withLocale("admin/ai"),
  checkPermission("manage_ai_models"),
  aiModels.createNewAIModel
);

router.post(
  "/update/:id",
  withLocale("admin/ai"),
  checkPermission("manage_ai_models"),
  aiModels.updateAIModel
);

router.post(
  "/delete/:id",
  withLocale("admin/ai"),
  checkPermission("manage_ai_models"),
  aiModels.deleteAIModel
);

module.exports = router;
