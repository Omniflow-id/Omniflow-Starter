// === Absolute / alias imports ===
const { db } = require("@db/db");
const { handleCache, invalidateCache } = require("@helpers/cache");
const {
  logUserActivity,
  ACTION_TYPES,
  RESOURCE_TYPES,
} = require("@helpers/log");
const { asyncHandler, ValidationError } = require("@middlewares/errorHandler");

/**
 * Get AI Use Cases management page
 * Route: GET /admin/ai_use_cases
 */
const getAIUseCasesPage = asyncHandler(async (req, res) => {
  const result = await handleCache({
    key: "admin:ai_use_cases:list",
    ttl: 300, // 5 minutes
    dbQueryFn: async () => {
      const [useCases] = await db.query(
        "SELECT * FROM ai_use_cases ORDER BY created_at DESC"
      );

      // Get all roles for the form
      const [roles] = await db.query(
        "SELECT role_id, role_name FROM roles WHERE deleted_at IS NULL ORDER BY role_name"
      );

      // Parse allowed_roles JSON for each use case
      const processedUseCases = useCases.map((useCase) => {
        let allowedRoles = [];
        try {
          allowedRoles =
            typeof useCase.allowed_roles === "string"
              ? JSON.parse(useCase.allowed_roles)
              : useCase.allowed_roles || [];
        } catch {
          allowedRoles = [];
        }
        return {
          ...useCase,
          allowed_roles_array: allowedRoles,
          allowed_roles_string: allowedRoles.join(", "),
        };
      });

      return { useCases: processedUseCases, roles };
    },
  });

  res.render("pages/admin/aiUseCases/index", {
    useCases: result.data.useCases,
    roles: result.data.roles,
    permissions: req.session.permissions || [],
    cacheInfo: {
      source: result.source,
      duration_ms: result.duration_ms,
    },
  });
});

/**
 * Get all active AI use cases (API endpoint)
 * Route: GET /api/ai_use_cases
 */
const getAllAIUseCases = asyncHandler(async (req, res) => {
  const userRole = req.session.user?.role;

  const result = await handleCache({
    key: `api:ai_use_cases:active:${userRole}`,
    ttl: 600, // 10 minutes
    dbQueryFn: async () => {
      const [useCases] = await db.query(
        `SELECT id, name, description, base_knowledge, prompt, allowed_roles, is_active
         FROM ai_use_cases
         WHERE is_active = TRUE
         ORDER BY name`
      );

      // Filter use cases based on user's role
      const accessibleUseCases = useCases.filter((useCase) => {
        let allowedRoles = [];
        try {
          allowedRoles =
            typeof useCase.allowed_roles === "string"
              ? JSON.parse(useCase.allowed_roles)
              : useCase.allowed_roles || [];
        } catch {
          allowedRoles = [];
        }
        return allowedRoles.includes(userRole) || allowedRoles.length === 0;
      });

      return { useCases: accessibleUseCases };
    },
  });

  if (result.data.useCases.length === 0) {
    return res.status(404).json({
      success: false,
      message: "No AI use cases found",
    });
  }

  res.json({
    success: true,
    data: result.data.useCases,
    cache: {
      source: result.source,
      duration_ms: result.duration_ms,
    },
  });
});

/**
 * Create new AI use case
 * Route: POST /admin/ai_use_cases/create
 */
const createNewAIUseCase = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    base_knowledge,
    prompt,
    allowed_roles,
    is_active,
  } = req.body;

  // Validate required fields
  if (!name || !description || !prompt || is_active === undefined) {
    throw new ValidationError(
      "Name, description, prompt, and status are required"
    );
  }

  // Check if use case name already exists
  const [existingUseCase] = await db.query(
    "SELECT id FROM ai_use_cases WHERE name = ?",
    [name]
  );

  if (existingUseCase.length > 0) {
    throw new ValidationError("Use case name already exists");
  }

  // Process allowed_roles
  const allowedRoles = Array.isArray(allowed_roles) ? allowed_roles : [];
  const allowedRolesJson = JSON.stringify(allowedRoles);
  const isActive = is_active === "1" || is_active === true;

  // Insert new AI use case
  const [result] = await db.query(
    `INSERT INTO ai_use_cases (name, description, base_knowledge, prompt, allowed_roles, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      name,
      description,
      base_knowledge || "",
      prompt,
      allowedRolesJson,
      isActive,
    ]
  );

  // Invalidate caches
  await invalidateCache("admin:ai_use_cases:*", true);
  await invalidateCache("api:ai_use_cases:*", true);

  // Log activity
  await logUserActivity(
    {
      activity: `Created new AI use case: ${name}`,
      actionType: ACTION_TYPES.CREATE,
      resourceType: RESOURCE_TYPES.SYSTEM,
      resourceId: result.insertId.toString(),
      userId: req.session.user.id,
      dataChanges: {
        after: {
          name,
          description,
          prompt,
          allowed_roles: allowedRoles,
          is_active: isActive,
        },
      },
    },
    req
  );

  req.flash("success", "AI Use Case created successfully");
  res.redirect("/admin/ai_use_cases");
});

/**
 * Update AI use case
 * Route: POST /admin/ai_use_cases/update/:id
 */
const updateAIUseCase = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    base_knowledge,
    prompt,
    allowed_roles,
    is_active,
  } = req.body;

  // Validate required fields
  if (!name || !description || !prompt || is_active === undefined) {
    throw new ValidationError(
      "Name, description, prompt, and status are required"
    );
  }

  // Check if use case exists
  const [existingUseCase] = await db.query(
    "SELECT id FROM ai_use_cases WHERE id = ?",
    [id]
  );

  if (existingUseCase.length === 0) {
    throw new ValidationError("AI Use Case not found");
  }

  // Check if use case name already exists (excluding current use case)
  const [duplicateUseCase] = await db.query(
    "SELECT id FROM ai_use_cases WHERE name = ? AND id != ?",
    [name, id]
  );

  if (duplicateUseCase.length > 0) {
    throw new ValidationError("Use case name already exists");
  }

  // Process allowed_roles
  const allowedRoles = Array.isArray(allowed_roles) ? allowed_roles : [];
  const allowedRolesJson = JSON.stringify(allowedRoles);
  const isActive = is_active === "1" || is_active === true;

  // Update AI use case
  await db.query(
    `UPDATE ai_use_cases
     SET name = ?, description = ?, base_knowledge = ?, prompt = ?, allowed_roles = ?, is_active = ?, updated_at = NOW()
     WHERE id = ?`,
    [
      name,
      description,
      base_knowledge || "",
      prompt,
      allowedRolesJson,
      isActive,
      id,
    ]
  );

  // Invalidate caches
  await invalidateCache("admin:ai_use_cases:*", true);
  await invalidateCache("api:ai_use_cases:*", true);

  // Log activity
  await logUserActivity(
    {
      activity: `Updated AI use case: ${name}`,
      actionType: ACTION_TYPES.UPDATE,
      resourceType: RESOURCE_TYPES.SYSTEM,
      resourceId: id,
      userId: req.session.user.id,
    },
    req
  );

  req.flash("success", "AI Use Case updated successfully");
  res.redirect("/admin/ai_use_cases");
});

/**
 * Delete AI use case
 * Route: POST /admin/ai_use_cases/delete/:id
 */
const deleteAIUseCase = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if use case exists
  const [existingUseCase] = await db.query(
    "SELECT name FROM ai_use_cases WHERE id = ?",
    [id]
  );

  if (existingUseCase.length === 0) {
    throw new ValidationError("AI Use Case not found");
  }

  const useCaseName = existingUseCase[0].name;

  // Delete AI use case
  await db.query("DELETE FROM ai_use_cases WHERE id = ?", [id]);

  // Invalidate caches
  await invalidateCache("admin:ai_use_cases:*", true);
  await invalidateCache("api:ai_use_cases:*", true);

  // Log activity
  await logUserActivity(
    {
      activity: `Deleted AI use case: ${useCaseName}`,
      actionType: ACTION_TYPES.DELETE,
      resourceType: RESOURCE_TYPES.SYSTEM,
      resourceId: id,
      userId: req.session.user.id,
    },
    req
  );

  req.flash("success", "AI Use Case deleted successfully");
  res.redirect("/admin/ai_use_cases");
});

module.exports = {
  getAIUseCasesPage,
  getAllAIUseCases,
  createNewAIUseCase,
  updateAIUseCase,
  deleteAIUseCase,
};
