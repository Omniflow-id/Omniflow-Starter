# Sub-Module Page ([/admin/submodule](/admin/submodule))

The **Sub-Module Page** is a template/placeholder page demonstrating sub-routing patterns in the Omniflow admin panel.

## Quick Actions

| Action | How |
|--------|-----|
| View sub-module | Go to [/admin/submodule](/admin/submodule) |
| Return to dashboard | Go to [/admin](/admin) |

## Purpose

This page serves as:
- **Template**: Example of sub-module structure
- **Placeholder**: For future feature development
- **Pattern**: Demonstrates nested routing

## Route Pattern

### URL Structure

```
/admin/submodule
```

### Route Hierarchy

```
/admin (Main admin area)
└── /submodule (Sub-module example)
```

## Page Structure

### Typical Sub-Module Components

**Header:**
- Breadcrumb navigation (Dashboard > Sub-Module)
- Page title
- Action buttons

**Content Area:**
- Feature-specific content
- Data tables or forms
- Statistics or charts

**Footer:**
- Related links
- Help resources

## Development Template

### Creating New Sub-Modules

When adding new sub-modules, follow this pattern:

**1. Route Definition** (`routes/admin.js`):
```javascript
router.get("/admin/submodule", isLoggedInAndActive, checkPermission("view_submodule"), getSubmodulePage);
```

**2. Controller** (`controllers/admin/getSubmodulePage.js`):
```javascript
const getSubmodulePage = asyncHandler(async (req, res) => {
  // Load data with cache
  const result = await handleCache({
    key: "admin:submodule:data",
    ttl: 300,
    dbQueryFn: async () => {
      // Database queries
      return { data };
    },
  });

  res.render("pages/admin/submodule", {
    data: result.data,
    cacheInfo: {
      source: result.source,
      duration_ms: result.duration_ms,
    },
  });
});
```

**3. View** (`views/pages/admin/submodule.njk`):
```html
{% extends "layout/masterLayout.njk" %}

{% block title %}Sub-Module{% endblock %}

{% block content %}
<div class="container-fluid">
  <h1>Sub-Module</h1>
  <!-- Content here -->
</div>
{% endblock %}
```

**4. Knowledge Base** (`knowledge/admin/submodule/en.md`):
- Document features and usage
- Add quick actions table
- Include common scenarios
- Provide troubleshooting guide

## Permission Configuration

### Required Permission

Create permission for sub-module:
```
Permission Name: view_submodule
Description: Access to sub-module features
```

**Assign to Roles:**
1. Go to [/admin/permissions](/admin/permissions)
2. Create `view_submodule` permission
3. Go to [/admin/roles](/admin/roles)
4. Assign to appropriate roles (Admin, Manager, etc.)

## Common Use Cases

### Use Case 1: Department-Specific Module

**Example:** HR department needs dedicated area

**Implementation:**
- Create `/admin/hr` sub-module
- Add `view_hr` permission
- Assign to "HR Manager" role
- Build HR-specific features

### Use Case 2: Feature-Specific Section

**Example:** Reporting module

**Implementation:**
- Create `/admin/reports` sub-module
- Add report generation features
- Integrate with data export
- Cache report results

### Use Case 3: Admin Tool

**Example:** System maintenance tools

**Implementation:**
- Create `/admin/tools` sub-module
- Add `manage_tools` permission (Admin only)
- Include maintenance operations
- Log all tool usage

## Integration Points

### Navigation

Add sub-module to sidebar (`views/partials/sidebarLayout.njk`):

```html
{% if hasPermission(permissions, 'view_submodule') %}
  <li class="nav-item">
    <a class="nav-link" href="/admin/submodule">
      <i class="fas fa-cube"></i>
      <span>Sub-Module</span>
    </a>
  </li>
{% endif %}
```

### Breadcrumbs

Include breadcrumb navigation:

```html
<nav aria-label="breadcrumb">
  <ol class="breadcrumb">
    <li class="breadcrumb-item"><a href="/admin">Dashboard</a></li>
    <li class="breadcrumb-item active">Sub-Module</li>
  </ol>
</nav>
```

## Best Practices

### Sub-Module Design

✅ **Good Practices:**
- Clear, specific purpose
- Dedicated permission check
- Cached data loading
- Activity logging
- Mobile-responsive design
- Consistent with admin UI

❌ **Avoid:**
- Mixing unrelated features
- No permission checks
- Directly querying database
- No error handling
- Breaking admin UI consistency

### Performance

✅ **Optimize:**
- Use Redis caching
- Server-side DataTables
- Lazy load heavy components
- Compress responses
- Index database queries

### Security

✅ **Secure:**
- Require authentication
- Check permissions
- Validate all inputs
- Sanitize outputs
- Log sensitive operations
- Use CSRF protection

## Testing Checklist

### Sub-Module Testing

- [ ] Route accessible with correct permission
- [ ] 403 error without permission
- [ ] Page loads correctly
- [ ] Data displays properly
- [ ] Forms submit successfully
- [ ] CSRF tokens work
- [ ] Cache invalidation works
- [ ] Mobile responsive
- [ ] Error handling works
- [ ] Activity logging active

## Documentation Requirements

### Knowledge Base Files

For each sub-module, create:

**English** (`knowledge/admin/submodule/en.md`):
- Overview and purpose
- Quick actions table
- Feature documentation
- Common scenarios
- Troubleshooting guide

**Indonesian** (`knowledge/admin/submodule/id.md`):
- Translated content
- Keep technical terms in English
- Maintain markdown structure

## Related Pages

| Page | Purpose |
|------|---------|
| **Dashboard** | [/admin](/admin) - Main admin area |
| **Permissions** | [/admin/permissions](/admin/permissions) - Permission management |
| **Roles** | [/admin/roles](/admin/roles) - Role configuration |
| **Activity Logs** | [/admin/log](/admin/log) - Operation audit |

## Example Sub-Modules

### Existing Sub-Modules

| Route | Purpose |
|-------|---------|
| `/admin/user/*` | User management operations |
| `/admin/queue/*` | Job queue management |
| `/admin/cache/*` | Cache operations |
| `/admin/log/*` | Activity log viewing |

### Potential New Sub-Modules

- `/admin/reports` - Reporting and analytics
- `/admin/settings` - System configuration
- `/admin/backup` - Backup and restore
- `/admin/audit` - Security audit logs
- `/admin/notifications` - Notification management

## Development Notes

This page demonstrates:
- **Routing patterns**: Nested admin routes
- **Permission integration**: Role-based access
- **UI consistency**: Follows admin template
- **Documentation**: Knowledge base integration
- **Scalability**: Easy to add new modules

**Template Status:** Ready for implementation
**Knowledge Base:** Complete (en.md, id.md)
**Route Example:** `/admin/submodule`
