# Activity Logs ([/admin/log/index](/admin/log/index))

The **Activity Logs** page provides a complete audit trail of all activities occurring in the Omniflow system.

## Key Features

### 1. Activity Log List
Complete table with columns:
- **Timestamp**: Time of occurrence
- **User**: Who performed the action
- **Action**: Activity type (CREATE, UPDATE, DELETE, LOGIN, etc.)
- **Module**: System area affected
- **Details**: Additional details in JSON format
- **IP Address**: User's IP address (for security audit)

### 2. Filter & Search

**Filter By:**
- **Date Range**: From date - To date
- **User**: Select specific user
- **Action Type**: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, ERROR
- **Module**: Users, Permissions, Queue, Cache, etc.

**Search:**
- Search by activity description
- Search in JSON details

### 3. Export Logs

**Export Formats:**
- **CSV**: For analysis in Excel
- **JSON**: For integration with other systems
- **PDF**: For audit reports

**Filtered Export:**
- Export only active filter results
- Useful for compliance reporting

## Activity Types

| Action | Description | Example |
|--------|-------------|---------|
| **CREATE** | New data creation | Add user, create role |
| **UPDATE** | Data modification | Edit user, update permission |
| **DELETE** | Data deletion | Delete user, soft delete |
| **LOGIN** | User login to system | Admin login from IP x.x.x.x |
| **LOGOUT** | User logout | Session ended |
| **ERROR** | Error/exception | Failed login attempt |
| **VIEW** | Read data access | View user details |

## Tracked Modules

- **users**: User management activities
- **permissions**: Permission & role changes
- **queue**: Job queue operations
- **cache**: Cache flush/invalidate
- **ai**: AI feature usage (Chat, Assistant, Copilot)
- **system**: System configuration

## Metadata Details

Click log row to see complete JSON details:
```json
{
  "user_id": 7,
  "username": "admin",
  "action": "UPDATE",
  "module": "users",
  "record_id": 15,
  "changes": {
    "old": { "role": "User" },
    "new": { "role": "Manager" }
  },
  "ip_address": "192.168.1.100"
}
```

## Audit Use Cases

### Security Investigation
**Scenario:** Suspicious activity detected

**Steps:**
1. Filter suspected user
2. Filter date range of incident
3. Check LOGIN action from unknown IP
4. Check permission/role changes
5. Export logs for evidence

### Compliance Report
**Scenario:** Need monthly audit report

**Steps:**
1. Set date range to last month
2. Filter critical actions (CREATE, DELETE)
3. Filter sensitive modules (permissions, users)
4. Export to PDF
5. Submit to auditor

### Troubleshooting
**Scenario:** Data changed but don't know who

**Steps:**
1. Search by record_id
2. Filter related module
3. Check UPDATE/DELETE actions
4. See detail of which user performed
5. Check timestamp for timeline

## Retention & Cleanup

**Default Retention:**
- Logs kept for 90 days
- Auto-cleanup job runs weekly
- Archive to cold storage (if configured)

**Manual Cleanup:**
- Admin with `manage_logs` permission can manual cleanup
- Filter old date range → Delete
- Or export first before delete

## Permissions

| Permission | Access |
|------------|--------|
| `view_logs` | View log list |
| `export_logs` | Export log data |
| `manage_logs` | Cleanup/archive logs |

## Best Practices

### Audit Trail
✅ **Always enable logging for:**
- Permission changes
- User CRUD
- System configuration changes
- Sensitive data access

### Regular Review
✅ **Schedule log review:**
- Daily: Check errors/exceptions
- Weekly: Review failed logins
- Monthly: Audit permission changes

### Security
⚠️ **Important:**
- Logs cannot be deleted by regular users
- Super admin can view all logs
- Log exports contain sensitive data → handle with care

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Logs not showing | Check active filters, clear filters |
| Export failed | Check data size, try more specific filter |
| JSON detail error | Check browser console, refresh page |
| Slow performance | Use smaller date range |

## Related Links

- [Users](/admin/users) - User management
- [Permissions](/admin/permissions) - Permission configuration
- [Queue](/admin/queue) - Background jobs
