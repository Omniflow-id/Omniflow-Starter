# User Profile ([/admin/profile](/admin/profile))

The **User Profile** page displays your account information, security settings, and provides access to password management.

## Quick Actions

| Action | How |
|--------|-----|
| View profile | Go to [/admin/profile](/admin/profile) |
| Change password | Click **"Change Password"** → Go to [/admin/change-password](/admin/change-password) |
| Check 2FA status | View **"2FA Security"** section |
| Review account status | View **"Account Status"** badge |

## Profile Information

### Account Details

| Field | Description |
|-------|-------------|
| **Username** | Your login username (unique) |
| **Email** | Your account email address |
| **Full Name** | Your complete name |
| **Role** | Your current role (Admin, Manager, User) |
| **Created At** | Account creation timestamp |

### Account Status

- **🟢 Active**: Full system access
- **🔴 Inactive**: Account disabled, no access

**Note:** Only admins can change account status at [/admin/users](/admin/users).

## Two-Factor Authentication (2FA)

### Current 2FA Method

The system uses **Email OTP** for two-factor authentication:

- **Method**: One-Time Password sent to your email
- **Validity**: 5 minutes per OTP
- **Non-blocking**: Email sent via RabbitMQ queue (< 200ms response)
- **Fallback**: Synchronous email if queue unavailable

### 2FA Security Features

✅ **Security Benefits:**
- Additional layer beyond password
- Protection against unauthorized access
- Email verification on each login
- Session-based OTP storage

### Development Bypass

For development/testing environments:
- **`DEV_2FA_BYPASS=true`** environment variable
- Skips OTP verification
- **Never use in production**

## Security Settings

### Password Policy

Your password must meet these requirements:

| Requirement | Default Value |
|-------------|---------------|
| Minimum length | 8 characters |
| Maximum length | 128 characters |
| Uppercase letters | Required |
| Lowercase letters | Required |
| Numbers | Required (minimum 1) |
| Special characters | Required (minimum 1) |
| Max repeating chars | 3 consecutive |

**Change Password:** [/admin/change-password](/admin/change-password)

### Session Security

- **Session Timeout**: 24 hours of inactivity
- **Sliding Session**: Auto-renewed on activity
- **Inactivity Warning**: Modal appears 2 minutes before timeout
- **Keep-Alive**: Background session refresh on user activity

### Activity Logging

All your account activities are logged:
- Login attempts
- Password changes
- Permission changes
- Profile updates

**View Logs:** [/admin/log](/admin/log) (filter by your username)

## Common Scenarios

### Scenario 1: Change Password

**When to Change:**
- Periodic security update (every 90 days recommended)
- Suspected account compromise
- After sharing credentials temporarily
- Joining company/leaving contractor

**How to Change:**
1. Click **"Change Password"** button on profile
2. Redirects to [/admin/change-password](/admin/change-password)
3. Enter current password
4. Enter new password (must meet policy)
5. Confirm new password
6. Submit → Password updated

### Scenario 2: Check Your Permissions

**How to View:**
1. Your role determines your permissions
2. View role details at [/admin/roles](/admin/roles)
3. Admin can grant/revoke individual permissions at [/admin/users](/admin/users)

**Common Permissions by Role:**
- **Admin**: All permissions
- **Manager**: `view_users`, `manage_users`, `view_logs`, `view_profile`
- **User**: `view_profile` only

### Scenario 3: 2FA Not Receiving OTP

**Troubleshooting:**
1. Check your email spam/junk folder
2. Verify email address is correct in profile
3. Check queue status at [/admin/queue](/admin/queue) (if admin)
4. Contact system administrator if persistent

**Admin Troubleshooting:**
- Check RabbitMQ connection status
- Review email worker logs
- Verify SMTP configuration
- Check circuit breaker state

### Scenario 4: Account Locked/Inactive

**Symptoms:**
- Cannot login
- "Account inactive" error message
- Profile shows 🔴 Inactive status

**Solution:**
- Contact your system administrator
- Admin can reactivate at [/admin/users](/admin/users)
- **Note:** You cannot activate your own account

## Troubleshooting

| Issue | Check | Solution |
|-------|-------|----------|
| Cannot change password | Current password correct? | Verify current password, check password policy |
| 2FA OTP not arriving | Email address correct? | Check spam folder, contact admin |
| Account shows inactive | Account status badge | Contact admin to reactivate |
| Permission denied errors | Your role permissions | Contact admin for permission review |
| Session timeout too fast | Activity level | System keeps session alive on activity |

## Security Best Practices

### Password Management

✅ **Good Practices:**
- Use unique password for this system
- Change password every 90 days
- Don't share credentials
- Use password manager

❌ **Avoid:**
- Reusing passwords from other systems
- Simple/predictable passwords
- Sharing account access
- Writing passwords down

### Session Security

✅ **Good Practices:**
- Logout when leaving computer
- Don't save password in browser (shared computers)
- Report suspicious activity
- Keep email secure (for 2FA)

❌ **Avoid:**
- Leaving sessions open on shared computers
- Using public WiFi without VPN
- Sharing 2FA codes
- Ignoring security warnings

### Account Security

✅ **Monitor:**
- Review your activity logs regularly
- Check for unfamiliar login locations
- Verify email address is current
- Report suspicious activity immediately

## Related Pages

- **Change Password**: [/admin/change-password](/admin/change-password)
- **User Management**: [/admin/users](/admin/users) (admin only)
- **Activity Logs**: [/admin/log](/admin/log) (view your activity)
- **Roles**: [/admin/roles](/admin/roles) (view role permissions)
