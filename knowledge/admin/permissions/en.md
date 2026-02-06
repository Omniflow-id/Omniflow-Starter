# Permissions Management ([/admin/permissions](/admin/permissions))

The **Permissions Management** feature allows Admins to create, view, and manage individual permissions in the Omniflow system. Permissions are the building blocks of the RBAC (Role-Based Access Control) system.

## Quick Actions

| Action | How |
|--------|-----|
| View all permissions | Go to [/admin/permissions](/admin/permissions) |
| Create new permission | Click **"+ Add Permission"** button |
| Edit permission | Click permission card → **Edit** |
| Delete permission | Click permission card → **Delete** (if not assigned to roles) |
| Assign to roles | Go to [/admin/roles](/admin/roles) |

## Built-in Permissions

| Permission Name | Description | Default Assignment |
|----------------|-------------|-------------------|
| `view_users` | View user accounts and information | Admin, Manager |
| `manage_users` | Create, edit, and delete user accounts | Admin, Manager |
| `manage_permissions` | Manage roles and permissions system | Admin only |
| `view_logs` | View system activity logs and audit trail | Admin, Manager |
| `manage_cache` | Manage system cache and performance | Admin |
| `manage_queue` | Manage job queues and background tasks | Admin |
| `view_profile` | View and edit own user profile | All roles |

## Permission Naming Conventions

### Standard Prefixes

| Prefix | Purpose | Examples |
|--------|---------|----------|
| `view_` | Read-only access | `view_users`, `view_logs`, `view_reports` |
| `manage_` | Full CRUD access | `manage_users`, `manage_cache`, `manage_queue` |
| `approve_` | Approval workflows | `approve_requests`, `approve_transactions` |
| `export_` | Data export operations | `export_users`, `export_reports` |
| `delete_` | Deletion operations | `delete_users`, `delete_records` |

### Best Practices

✅ **Good Names:**
- `view_financial_reports`
- `manage_inventory`
- `approve_leave_requests`
- `export_employee_data`

❌ **Bad Names:**
- `financial` (too vague)
- `all_access` (defeats purpose of RBAC)
- `admin_permission` (unclear scope)

## Creating a New Permission

1. Navigate to **[Permissions Management](/admin/permissions)**
2. Click **"+ Add Permission"** button
3. Fill in the form:
   - **Permission Name**: Use underscore_case (e.g., `view_reports`)
   - **Description**: Brief explanation of what this permission allows
4. Click **Save**
5. **Next Step**: Assign to roles at [/admin/roles](/admin/roles)

### Example: Creating Department-Specific Permission

**Scenario:** HR department needs access to employee records

```
Permission Name: view_employee_records
Description: View employee personal information and records
```

Then assign to "HR Manager" role at [/admin/roles](/admin/roles).

## Permission vs Role Relationship

### Key Concepts

- **Permissions**: Atomic access rights (e.g., `view_users`)
- **Roles**: Collections of permissions (e.g., "Manager" has `view_users` + `manage_users`)
- **Users**: Assigned to ONE role, inherit all role permissions
- **Overrides**: Users can have individual permission grants or revokes (PBAC)

### Permission Flow

```
Permission → Role → User → Access Granted
```

**Example:**
1. Create permission `manage_reports`
2. Assign to role "Report Manager" at [/admin/roles](/admin/roles)
3. Assign users to "Report Manager" role at [/admin/users](/admin/users)
4. Users can now manage reports

## User Permission Overrides (PBAC)

The system supports **user-specific permission overrides** that extend or restrict role permissions:

### Grant Additional Permissions

Give a specific user extra permissions beyond their role:

1. Go to [/admin/users](/admin/users)
2. Click user → **Manage Permissions**
3. Enable additional permissions not in their role
4. **Result**: User gets role permissions + additional permissions

**Example:**
- Manager role has: `view_users`, `manage_users`, `view_logs`
- Grant `manage_cache` to specific manager
- Final permissions: `view_users`, `manage_users`, `view_logs`, `manage_cache`

### Revoke Role Permissions

Remove specific permissions from a user without changing their role:

1. Go to [/admin/users](/admin/users)
2. Click user → **Manage Permissions**
3. Disable specific role permissions
4. **Result**: User loses that permission even though their role has it

**Example:**
- Manager role has: `view_users`, `manage_users`, `view_logs`
- Revoke `manage_users` from specific manager
- Final permissions: `view_users`, `view_logs`

### Override Formula

```
Final User Permissions = (Role Permissions + User Grants) - User Revokes
```

### When to Use Overrides

✅ **Good Use Cases:**
- Temporary elevated access
- Training/probation periods
- Contractor with limited scope
- Cross-functional team member

❌ **Bad Use Cases:**
- Permanent access patterns (create a new role instead)
- Multiple users need same override (modify the role)
- Security exceptions (fix security policy)

## Editing Permissions

### Change Permission Details

1. Click on permission card at [/admin/permissions](/admin/permissions)
2. Click **Edit**
3. Update name or description
4. Click **Save**

⚠️ **Warning:** Changing permission name affects all roles and users using it.

### Check Permission Usage

Before editing, see where permission is used:

1. Click on permission card
2. View **"Used by X roles"** count
3. Click to see role list
4. Navigate to [/admin/roles](/admin/roles) to review

## Deleting Permissions ⚠️

### Pre-Delete Checklist

Before deleting a permission:

1. Check roles using this permission at [/admin/roles](/admin/roles)
2. Check users with override grants at [/admin/users](/admin/users)
3. Remove from all roles first
4. Remove all user overrides
5. Then delete permission

### How to Delete

1. Go to [/admin/permissions](/admin/permissions)
2. Click permission card → **Delete**
3. Confirm deletion

### Security Rules

- ❌ Cannot delete if assigned to any role
- ❌ Cannot delete if any user has override grant/revoke
- ✅ Deleted permission removed from system permanently
- ⚠️ No undo - deletion is permanent

## Common Scenarios

### Scenario 1: New Feature Needs Access Control

**Problem:** Built new "Reports" feature, need to control access

**Solution:**
1. Create permissions at [/admin/permissions](/admin/permissions):
   - `view_reports` (read-only)
   - `manage_reports` (full access)
2. Go to [/admin/roles](/admin/roles)
3. Assign `view_reports` to "User" role
4. Assign `manage_reports` to "Manager" role

### Scenario 2: Temporary Project Access

**Problem:** Developer needs temporary cache access for debugging

**Solution:**
1. Go to [/admin/users](/admin/users)
2. Find developer → **Manage Permissions**
3. Grant `manage_cache` permission
4. After debugging, revoke the permission override
5. **Result**: Temporary access without changing their role

### Scenario 3: Department Restructuring

**Problem:** Finance team now manages inventory

**Solution:**
1. Create permissions at [/admin/permissions](/admin/permissions):
   - `view_inventory`
   - `manage_inventory`
2. Go to [/admin/roles](/admin/roles)
3. Find "Finance" role → **Manage Permissions**
4. Add inventory permissions
5. All Finance team users get instant access

### Scenario 4: Contractor with Limited Scope

**Problem:** External contractor needs user view but not sensitive data

**Solution:**
1. Create "Contractor" role at [/admin/roles](/admin/roles)
2. Assign only `view_users` and `view_profile`
3. If contractor needs exception, use permission overrides
4. When contract ends, deactivate user account

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Permission not found in role | Go to [/admin/roles](/admin/roles) → Manage Permissions → Add it |
| User has permission but can't access | Check if user account is active at [/admin/users](/admin/users) |
| Can't delete permission | Remove from all roles and user overrides first |
| Permission change not working | User may need to logout and login again |
| Too many permissions | Consider creating permission categories/groups |
| Override not taking effect | Check activity logs at [/admin/log](/admin/log) for errors |

## Permission System Architecture

### Cache Integration

- Permission lookups are cached in Redis for 5 minutes
- Cache key pattern: `user:{userId}:permissions`
- Changes invalidate cache automatically
- View cache stats at [/admin/cache/stats](/admin/cache/stats)

### Activity Logging

All permission changes are logged:

- Permission creation/deletion
- Role permission assignments
- User permission overrides (grants/revokes)
- View logs at [/admin/log](/admin/log)

### Database Tables

- `permissions` - All system permissions
- `role_permissions` - Role-to-permission mappings
- `user_permissions` - User-specific overrides (grants/revokes)
- Soft deletes enabled for permissions (can be restored)
