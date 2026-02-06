# Role Management ([/admin/roles](/admin/roles))

The **Role Management** feature allows Admins to manage user access levels in the Omniflow system using Role-Based Access Control (RBAC).

## Quick Actions

| Action | How |
|--------|-----|
| View all roles | Go to [/admin/roles](/admin/roles) |
| Create new role | Click **"Add Role"** button |
| Edit permissions | Click role → **Manage Permissions** |
| Delete role | Click role → Delete (if no users assigned) |

## Default Roles

| Role | Description | Cannot Delete |
|------|-------------|---------------|
| **Admin** | Full system access | ✓ Locked |
| **Manager** | User management + monitoring | ✗ |
| **User** | Basic profile access only | ✗ |

## Creating a New Role

1. Navigate to **[Roles Management](/admin/roles)**
2. Click **"+ Add Role"** button
3. Fill in the form:
   - **Role Name**: Unique name (e.g., "HR Manager", "Finance")
   - **Description**: Brief purpose of this role
4. Click **Save** → Role created with NO permissions
5. **Important**: Assign permissions immediately after creation

## Managing Permissions

After creating a role, you need to assign permissions:

1. Click on the role card at [/admin/roles](/admin/roles)
2. Click **"Manage Permissions"** button
3. Select permissions from the list:
   - `view_users` - View user list
   - `manage_users` - Create/edit/delete users
   - `manage_permissions` - Configure roles
   - `view_logs` - Access activity logs
   - `manage_cache` - Clear cache
   - `manage_queue` - Manage job queues
   - `view_profile` - View own profile
4. Click **Save Permissions**

## Available Permissions Reference

| Permission | Description | Use Case |
|------------|-------------|----------|
| `view_users` | View user accounts | Managers need this |
| `manage_users` | CRUD users + reset password | HR/Admin tasks |
| `manage_permissions` | Configure roles & permissions | Super admin only |
| `view_logs` | Read activity history | Audit & monitoring |
| `manage_cache` | Flush Redis cache | Technical operations |
| `manage_queue` | Manage job queues | Background jobs |
| `view_profile` | View own profile | All users need this |

## Role Combination Examples

**HR Manager:**
- `view_users`
- `manage_users`
- `view_profile`

**Finance User:**
- `view_users`
- `view_profile`
- (add finance-specific permissions)

**Support Staff:**
- `view_users`
- `view_logs`
- `view_profile`

## Editing Roles

### Change Role Name/Description
1. Click on the role at [/admin/roles](/admin/roles)
2. Click **Edit**
3. Update fields
4. **Note**: Permission assignments remain unchanged

### Change Permissions
1. Click on the role
2. Click **Manage Permissions**
3. Add/remove permissions
4. **Note**: Changes take effect immediately for all users with this role

## Deleting Roles ⚠️

**Before Deleting:**
1. Check if users are assigned to this role at [/admin/users](/admin/users)
2. Reassign users to another role first
3. Delete only when NO users have this role

**How to Delete:**
1. Click on the role
2. Click **Delete**
3. Confirm deletion

**Security Rules:**
- ❌ **Admin role** (ID 1) CANNOT be deleted
- ❌ Cannot delete role if users are assigned
- ✅ Deleted role permissions are removed from all users

## Common Scenarios

### Scenario 1: New Department Needs Access
**Problem:** Finance team needs access to user data
**Solution:**
1. Create role "Finance" at [/admin/roles](/admin/roles)
2. Assign `view_users`, `view_profile` permissions
3. Add finance team users to this role at [/admin/users](/admin/users)

### Scenario 2: Manager Needs Extra Permissions
**Problem:** A manager needs to view logs
**Solution:**
1. Go to [/admin/roles](/admin/roles)
2. Click Manager role → Manage Permissions
3. Add `view_logs` permission
4. Save

### Scenario 3: Revoke Access Quickly
**Problem:** Employee leaving today
**Solution:**
1. Go to [/admin/users](/admin/users)
2. Find user → Edit
3. Set "Active" to OFF
4. User loses all access immediately

## Troubleshooting

| Issue | Solution |
|-------|----------|
| User can't access feature | Check role permissions at [/admin/roles](/admin/roles) |
| Too many permissions | Remove unused permissions from role |
| Admin locked out | Contact system administrator |
| Permission not taking effect | User may need to re-login |
