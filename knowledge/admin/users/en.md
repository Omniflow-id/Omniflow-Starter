# User Management ([/admin/users](/admin/users))

The **User Management** page is the control center for managing user accounts in the Omniflow system.

## Key Features

### 1. User List
Complete table with information:
- **ID**: Unique user identifier
- **Username**: User login name
- **Email**: Registered email address
- **Full Name**: User's full name
- **Role**: Access level (Admin, Manager, User)
- **Status**: Active/Inactive
- **Last Login**: Last login time
- **Created At**: Account creation date

### 2. Add New User

**Manual Method:**
1. Click **"Add User"** button
2. Fill the form:
   - Username (unique)
   - Email (valid & unique)
   - Full Name
   - Password (or auto-generate)
   - Role
3. Click **Save**

**Auto-Generate Password:**
- System will generate random password
- Password displayed once at creation
- User must change password on first login

### 3. Edit User

**Editable Data:**
- Email
- Full Name
- Role
- Status (Active/Inactive)
- Password (reset)

**How to Edit:**
1. Click **Edit** icon on user row
2. Change required data
3. Click **Save**

### 4. Reset Password

**Reset Steps:**
1. Click **Edit** user
2. Click **"Reset Password"** button
3. Choose:
   - **Auto-generate**: System creates new password
   - **Manual**: Admin inputs new password
4. New password is displayed (copy & send to user)

### 5. Toggle Active Status

**Disable User:**
1. Click toggle switch in Status column
2. Confirm deactivation
3. User can no longer login

**Reactivate:**
1. Click toggle switch
2. User can login again with same credentials

### 6. Delete User (Soft Delete)

**Delete Steps:**
1. Click **Delete** icon (trash)
2. Confirm deletion
3. User is soft deleted (can be restored)

**Note:** User data is not actually lost, only marked as deleted.

### 7. Bulk Import via Excel

**Download Template:**
1. Click **"Download Template"**
2. Fill template with user data
3. Upload Excel file

**Template Columns:**
- username (required, unique)
- email (required, valid)
- full_name (required)
- password (optional, empty = auto-generate)
- role (required: Admin/Manager/User)
- is_active (1 or 0)

**Import Validation:**
- Check duplicate username/email
- Validate email format
- Password minimum 8 characters (if manual)
- Role must be valid

### 8. Export Data

**Export Options:**
- **CSV**: For import to other systems
- **Excel**: Editable format
- **JSON**: For API integration

**Filtered Export:**
- Export only filtered data
- Example: Export only active users

## Filter & Search

### Search Box
Search by:
- Username
- Email
- Full Name

### Column Filter
- **Role**: Filter by role
- **Status**: Active/Inactive/All
- **Date Range**: Account creation date

### Sorting
Click column header to sort:
- ID (asc/desc)
- Username (A-Z/Z-A)
- Created At (newest/oldest)
- Last Login (active/inactive)

## Required Permissions

| Permission | Description |
|------------|-------------|
| `view_users` | View user list |
| `manage_users` | User CRUD operations |
| `manage_permissions` | Change user permissions |

## Best Practices

### Security
✅ **Always:**
- Use auto-generate password for new users
- Require users to change password on first login
- Disable (not delete) resigned users
- Audit permission changes

❌ **Don't:**
- Share user passwords with anyone
- Leave users without a role
- Permanently delete users with important data

### Management
✅ **Recommended:**
- Monthly review of active users
- Disable users who haven't logged in for >90 days
- Assign roles according to job function
- Document permission changes

## Troubleshooting

| Issue | Solution |
|-------|----------|
| User can't login | Check active status & password |
| Email already registered | Use another email or reset old user |
| Role doesn't appear | Check configuration in Roles page |
| Import failed | Check Excel format & validation error message |
| Password reset not working | Ensure email server is running |

## Related Links

- [Roles](/admin/roles) - Role & permission configuration
- [Overview](/admin/overview) - User statistics
- [Activity Logs](/admin/log) - User activity audit
