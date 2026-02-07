const express = require("express");
const router = express.Router();
const { doubleCsrfProtection } = require("@middlewares/csrfProtection");
const { checkPermission } = require("@middlewares/checkPermission");
const { withLocale } = require("@helpers/i18n");

const aiUseCases = require("./aiUseCases.controller");

// Page routes
router.get(
  "/",
  withLocale("admin/ai"),
  checkPermission("manage_ai_use_cases"),
  aiUseCases.getAIUseCasesPage
);

// API routes
router.get("/api/ai_use_cases", aiUseCases.getAllAIUseCases);

// CRUD routes with CSRF protection
router.post(
  "/create",
  withLocale("admin/ai"),
  checkPermission("manage_ai_use_cases"),
  doubleCsrfProtection,
  aiUseCases.createNewAIUseCase
);

router.post(
  "/update/:id",
  withLocale("admin/ai"),
  checkPermission("manage_ai_use_cases"),
  doubleCsrfProtection,
  aiUseCases.updateAIUseCase
);

router.post(
  "/delete/:id",
  withLocale("admin/ai"),
  checkPermission("manage_ai_use_cases"),
  doubleCsrfProtection,
  aiUseCases.deleteAIUseCase
);

module.exports = router;
