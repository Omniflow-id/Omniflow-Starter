# Dashboard & Omniflow System Features

Welcome to **Omniflow Advanced ERP**. This dashboard is the control center for managing all aspects of the system.

## Quick Navigation

| Menu | Route | Description |
|------|-------|-------------|
| [Dashboard](/admin) | `/admin` | Main dashboard overview |
| [Users](/admin/users) | `/admin/users` | Manage application users |
| [Roles](/admin/roles) | `/admin/roles` | Manage user roles & permissions |
| [Permissions](/admin/permissions) | `/admin/permissions` | Configure access permissions |
| [Cache](/admin/cache) | `/admin/cache` | Monitor Redis cache |
| [Queue](/admin/queue) | `/admin/queue` | Monitor background jobs |
| [Logs](/admin/logs) | `/admin/logs` | View system activity logs |
| [Profile](/admin/profile) | `/admin/profile` | Manage your profile |

## Key Features (Admin)

### 1. **User Management ([/admin/users](/admin/users))**
Manage application user data.

**Capabilities:**
- **View Users**: Displays list of all users with email, role, status, and last login
- **Add User**: Register new users with automatic password generation
- **Edit User**: Update profile, reset passwords, toggle active status
- **Import Users**: Bulk import via Excel template

**Common Tasks:**
- Reset user password → Go to [Users](/admin/users) → Edit → Reset Password
- Deactivate user → Go to [Users](/admin/users) → Toggle active status
- Create new admin → Go to [Users](/admin/users) → Add User → Select "Admin" role

### 2. **Permissions System**
Role-Based Access Control (RBAC) for granular access management.

#### **Roles ([/admin/roles](/admin/roles))**
Manage user access levels:
- **Admin**: Full system access (cannot be deleted)
- **Manager**: User management + monitoring access
- **User**: Basic profile access only

**Actions:**
- [Add new role](/admin/roles) → Click "Add Role"
- [Edit role permissions](/admin/roles) → Click role → Manage Permissions

#### **Permissions ([/admin/permissions](/admin/permissions))**
Granular access rights:
- `view_users` - View user accounts
- `manage_users` - Create, edit, delete users
- `manage_permissions` - Configure roles & permissions
- `view_logs` - Access activity logs
- `manage_cache` - Clear cache operations
- `manage_queue` - Manage job queues
- `view_profile` - View own profile

### 3. **System Monitoring**

#### **Cache ([/admin/cache](/admin/cache))**
Redis caching management:
- View cache statistics (hits, misses, memory)
- Test cache performance
- Flush cache when needed
- Monitor connection health

**Use Case:** After major data changes, clear cache to ensure users see updated data.

#### **Queue ([/admin/queue](/admin/queue))**
RabbitMQ job queue monitoring:
- View pending, processing, completed, failed jobs
- Retry failed jobs
- Monitor queue statistics
- Check circuit breaker status

**Use Case:** Monitor bulk email sending progress or background import jobs.

#### **Logs ([/admin/logs](/admin/logs))**
System activity tracking:
- Filter by action type, user, date range
- Export logs for audit
- View detailed activity metadata
- Track user actions for security

**Use Case:** Investigate security incidents or user actions.

### 4. **Settings & Profile**

#### **Profile ([/admin/profile](/admin/profile))**
- Update personal information (name, email)
- Change password
- Configure 2FA settings

#### **2FA Security**
- Email-based OTP verification
- Required for admin accounts (configurable)
- Backup codes available

## Default Roles & Permissions

| Role | Key Permissions |
|------|------------------|
| **Admin** | All permissions |
| **Manager** | view_users, manage_users, view_logs, view_profile |
| **User** | view_profile only |

## Usage Tips

1. **Quick Search**: Use the search bar in tables to find users or logs instantly
2. **Keyboard Shortcuts**: Press `Ctrl+K` for quick navigation (if enabled)
3. **Error Investigation**: If something doesn't work → Check [Logs](/admin/logs) first
4. **Cache Issues**: After data updates → Clear cache at [/admin/cache](/admin/cache)
5. **Bulk Operations**: Use Excel import at [Users](/admin/users) for批量 user creation

## FAQ

**Q: How to create a new admin?**
A: Go to [Users](/admin/users) → Add User → Select "Admin" role

**Q: User can't access a feature?**
A: Check their role permissions at [/admin/roles](/admin/roles)

**Q: Where to see who deleted a record?**
A: Check activity logs at [/admin/logs](/admin/logs) with filter "delete"
