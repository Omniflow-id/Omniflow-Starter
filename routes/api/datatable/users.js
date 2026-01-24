const { db } = require("@db/db");
const { handleCache } = require("@helpers/cache");
const { asyncHandler } = require("@middlewares/errorHandler");
const { generateCsrfToken } = require("@middlewares/csrfProtection");

const getUsersDataTable = asyncHandler(async (req, res) => {
  const {
    draw = 1,
    start = 0,
    length = 10,
    search = {},
    order = [],
    columns = [],
  } = req.query;

  // Parse DataTables parameters
  const offset = parseInt(start);
  const limit = parseInt(length);
  const searchValue = search.value || "";

  // Base query
  let query = `
    SELECT 
      u.id,
      u.username,
      u.email,
      u.full_name,
      u.is_active,
      u.created_at,
      r.role_name as role
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.role_id
    WHERE u.deleted_at IS NULL
  `;

  let countQuery = `
    SELECT COUNT(*) as total
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.role_id
    WHERE u.deleted_at IS NULL
  `;

  const queryParams = [];
  const countParams = [];

  // Add search functionality
  if (searchValue) {
    const searchCondition = `
      AND (
        u.username LIKE ? OR 
        u.email LIKE ? OR 
        u.full_name LIKE ? OR
        r.role_name LIKE ?
      )
    `;
    query += searchCondition;
    countQuery += searchCondition;

    const searchParam = `%${searchValue}%`;
    queryParams.push(searchParam, searchParam, searchParam, searchParam);
    countParams.push(searchParam, searchParam, searchParam, searchParam);
  }

  // Add column-specific search
  columns.forEach((column, index) => {
    if (column.search?.value) {
      const columnMap = {
        0: "u.id",
        1: "u.username",
        2: "u.email",
        3: "r.role_name",
        4: "u.is_active",
      };

      if (columnMap[index]) {
        const columnSearchCondition = ` AND ${columnMap[index]} LIKE ?`;
        query += columnSearchCondition;
        countQuery += columnSearchCondition;

        const columnSearchParam = `%${column.search.value}%`;
        queryParams.push(columnSearchParam);
        countParams.push(columnSearchParam);
      }
    }
  });

  // Add ordering
  if (order && order.length > 0) {
    const orderColumn = order[0].column;
    const orderDir = order[0].dir === "desc" ? "DESC" : "ASC";

    const columnMap = {
      0: "u.id",
      1: "u.username",
      2: "u.email",
      3: "r.role_name",
      4: "u.is_active",
      5: "u.created_at",
    };

    if (columnMap[orderColumn]) {
      query += ` ORDER BY ${columnMap[orderColumn]} ${orderDir}`;
    }
  } else {
    query += " ORDER BY u.created_at DESC";
  }

  // Add pagination
  query += " LIMIT ? OFFSET ?";
  queryParams.push(limit, offset);

  try {
    // Create cache key based on query parameters for pagination
    const cacheKey = `datatable:users:${Buffer.from(
      JSON.stringify({
        search: searchValue,
        offset,
        limit,
        order: order?.[0] || {},
        columns: columns.filter((col) => col.search?.value),
      })
    ).toString("base64")}`;

    // Use cache with 2-minute TTL for DataTable data
    const result = await handleCache({
      key: cacheKey,
      ttl: 120, // 2 minutes (shorter TTL for real-time data)
      dbQueryFn: async () => {
        // Get filtered count
        const [countResult] = await db.query(countQuery, countParams);
        const filteredCount = countResult[0].total;

        // Get total count (without filters)
        const [totalResult] = await db.query(`
          SELECT COUNT(*) as total 
          FROM users 
          WHERE deleted_at IS NULL
        `);
        const totalCount = totalResult[0].total;

        // Get data
        const [users] = await db.query(query, queryParams);

        return { users, filteredCount, totalCount };
      },
    });

    const { users, filteredCount, totalCount } = result.data;

    // Generate CSRF token for forms in DataTable
    const csrfToken = generateCsrfToken(req, res);

    // Format data for DataTables
    const data = users.map((user) => [
      user.id,
      user.username,
      user.email,
      user.role || "No Role",
      user.is_active
        ? '<span class="badge bg-success">Active</span>'
        : '<span class="badge bg-secondary">Inactive</span>',
      `
        <div class="btn-group" role="group">
          <a href="/user/edit/${user.id}" class="btn btn-sm btn-primary">
            <i class="fas fa-edit"></i>
          </a>
          <a href="/admin/user/${user.id}/permissions" class="btn btn-sm btn-info" title="Manage User Permissions">
            <i class="fas fa-key"></i>
          </a>
          ${user.id !== req.session.user?.id
        ? `
            <form method="POST" action="/admin/user/toggle-active/${user.id}" style="display: inline-block;">
              <input type="hidden" name="_csrf" value="${csrfToken}" />
              <button type="submit" class="btn btn-sm ${user.is_active ? "btn-warning" : "btn-success"}">
                ${user.is_active ? '<i class="fas fa-user-slash"></i>' : '<i class="fas fa-user-check"></i>'}
              </button>
            </form>
            <button class="btn btn-sm btn-danger btn-delete-user" data-id="${user.id}" data-username="${user.username}" title="Delete User">
              <i class="fas fa-trash"></i>
            </button>
          `
        : ""
      }
        </div>
      `,
    ]);

    // Return DataTables response with cache info
    res.json({
      draw: parseInt(draw),
      recordsTotal: totalCount,
      recordsFiltered: filteredCount,
      data: data,
      cache: {
        source: result.source,
        duration_ms: result.duration_ms,
      },
    });
  } catch (error) {
    console.error("❌ [DATATABLE] Error getting users data:", error.message);
    res.status(500).json({
      draw: parseInt(draw),
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
      error: "Failed to load data",
    });
  }
});

module.exports = getUsersDataTable;
