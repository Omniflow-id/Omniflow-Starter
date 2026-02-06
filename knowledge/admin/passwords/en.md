# Generated Passwords ([/admin/passwords](/admin/passwords))

The **Generated Passwords** page displays auto-generated passwords after bulk user imports, allowing admins to communicate credentials securely to new users.

## Quick Actions

| Action | How |
|--------|-----|
| View generated passwords | Go to [/admin/passwords](/admin/passwords) after Excel import |
| Copy password | Click password text to copy |
| Download password list | Click **"Download CSV"** button (if available) |
| Return to users | Go to [/admin/users](/admin/users) |

## When Passwords Are Generated

### Bulk User Upload Process

Generated passwords appear after:

1. Admin navigates to [/admin/users](/admin/users)
2. Clicks **"Upload Users"** button
3. Uploads Excel file with user data
4. System creates users with auto-generated passwords
5. **Redirects to** [/admin/passwords](/admin/passwords)
6. Displays all generated passwords for distribution

### Excel File Requirements

**Required Columns (4 total):**
- `name` - Username for login
- `email` - User email address
- `full_name` - Complete name for password generation
- `role` - User role (Admin, Manager, User)

**Note:** Password column NOT required (auto-generated).

## Password Generation Pattern

### Formula

```
FullNameWithoutSpaces + "@12345?."
```

### Examples

| Full Name | Generated Password |
|-----------|-------------------|
| Eric Julianto | `EricJulianto@12345?.` |
| Jane Smith | `JaneSmith@12345?.` |
| Ahmad Wijaya | `AhmadWijaya@12345?.` |
| Maria Garcia | `MariaGarcia@12345?.` |
| John Doe | `JohnDoe@12345?.` |

### Pattern Components

| Component | Purpose | Example |
|-----------|---------|---------|
| **Full Name** | User identification | `EricJulianto` |
| **No Spaces** | Removes whitespace | `Eric Julianto` → `EricJulianto` |
| **@** | Special character | `@` |
| **12345** | Numbers | `12345` |
| **?.** | Additional symbols | `?.` |

### Password Policy Compliance

✅ **Meets All Requirements:**
- **Uppercase**: First letter of each name part (E, J)
- **Lowercase**: Remaining letters (ric, ulianto)
- **Numbers**: Fixed pattern (12345)
- **Symbols**: Three symbols (@, ?, .)
- **Length**: Typically 15-30 characters
- **No Repeating**: Maximum 2 consecutive characters

## Security Warnings

### ⚠️ Generated Password Risks

**Predictable Pattern:**
- Passwords follow consistent formula
- Can be guessed if pattern is known
- **Not suitable for long-term use**

**Security Best Practice:**
- Users MUST change password on first login
- Communicate passwords securely (encrypted email, secure messaging)
- Delete/invalidate temporary passwords after use
- Monitor for unchanged generated passwords

### First-Time User Instructions

**Email Template for New Users:**

```
Subject: Welcome to Omniflow - Account Credentials

Dear [Full Name],

Your account has been created:

Username: [username]
Temporary Password: [GeneratedPassword]
Login URL: [APP_URL]/admin/login

IMPORTANT SECURITY NOTICE:
1. Login with the temporary password above
2. IMMEDIATELY change your password at /admin/change-password
3. Choose a unique, strong password
4. Do not share your credentials

This temporary password is predictable and must be changed immediately.
```

## Password Display Page

### Information Shown

For each generated user:
- **Username**: Login identifier
- **Email**: User email address
- **Full Name**: Complete name
- **Role**: Assigned role
- **Generated Password**: Temporary password (visible)

### Security Features

- **One-Time Display**: Page only shows after import
- **No Permanent Storage**: Passwords shown once, not retrievable later
- **Session-Based**: Data cleared after navigation away
- **Admin-Only Access**: Requires `manage_users` permission

## Common Scenarios

### Scenario 1: Bulk User Onboarding

**Use Case:** HR imports 50 new employees from Excel

**Process:**
1. HR prepares Excel with 4 columns (name, email, full_name, role)
2. Upload at [/admin/users](/admin/users)
3. System generates 50 users with passwords
4. **Redirects to** [/admin/passwords](/admin/passwords)
5. HR copies/downloads password list
6. HR sends individual emails with credentials
7. New users login and change passwords

**Best Practice:**
- Send credentials via encrypted email
- Use secure password sharing service
- Set expiration on temporary passwords
- Monitor first-login completion

### Scenario 2: Single User Quick Add

**Use Case:** Need to onboard one contractor immediately

**Process:**
1. Create Excel with single row:
   ```
   name,email,full_name,role
   jdoe,john.doe@example.com,John Doe,User
   ```
2. Upload file
3. View generated password: `JohnDoe@12345?.`
4. Send credentials via secure channel
5. Instruct to change password immediately

### Scenario 3: Password List Lost

**Problem:** Admin navigated away before saving passwords

**Impact:**
- Generated passwords no longer visible
- Users cannot login
- Need password reset

**Solution:**
1. Navigate to [/admin/users](/admin/users)
2. For each user: Click **Edit** → **Reset Password**
3. System generates new password
4. Admin provides new credentials

**Prevention:**
- Download password CSV immediately
- Copy to secure password manager
- Don't navigate away until passwords saved

### Scenario 4: User Never Changed Password

**Security Risk:** User still using `FullName@12345?.` password

**Detection:**
1. Review activity logs at [/admin/log](/admin/log)
2. Check for password change events
3. Identify users without password changes

**Solution:**
1. Force password change on next login (if feature available)
2. Deactivate account until password changed
3. Contact user to change password
4. Reset password if user unresponsive

## Best Practices

### Admin Responsibilities

✅ **During Import:**
- Review generated passwords immediately
- Download/copy password list before navigating away
- Verify all users created successfully
- Note any errors or failed imports

✅ **Distribution:**
- Send credentials via secure channels only
- Never email passwords in plain text
- Use password sharing services (e.g., 1Password, Bitwarden)
- Include first-login instructions
- Set follow-up reminders

✅ **Monitoring:**
- Track first-login completion
- Monitor for unchanged passwords
- Review activity logs regularly
- Follow up with users who haven't logged in

### User Communication

**Secure Distribution Methods:**

| Method | Security | Recommended |
|--------|----------|-------------|
| Encrypted Email | Medium | ✓ For low-risk systems |
| Password Manager Share | High | ✓ Best practice |
| Secure Messaging (Signal) | High | ✓ For sensitive accounts |
| In-Person | Highest | ✓ For executives |
| Plain Text Email | Very Low | ✗ Never use |
| SMS | Low | ✗ Avoid |
| Slack/Teams DM | Low | ✗ Avoid |

## Excel Import Requirements

### Correct Format

**File:** `users.xlsx` or `users.csv`

**Column Order (exact names):**
```
name,email,full_name,role
```

**Example Data:**
```csv
name,email,full_name,role
jsmith,jane.smith@company.com,Jane Smith,Manager
bdoe,bob.doe@company.com,Bob Doe,User
aadmin,alice@company.com,Alice Admin,Admin
```

### Common Import Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Column not found | Wrong column names | Use exact: name, email, full_name, role |
| Duplicate email | Email exists in system | Remove duplicates from Excel |
| Invalid role | Role not found | Use: Admin, Manager, or User |
| Missing required field | Empty cell | Fill all 4 columns for each user |
| File format error | Wrong file type | Use .xlsx or .csv only |

## Troubleshooting

| Issue | Diagnosis | Solution |
|-------|-----------|----------|
| Password page empty | Import failed | Check upload errors, retry import |
| Cannot copy passwords | Browser restriction | Use Download CSV button |
| Passwords not working | Typo or caps lock | Verify exact password (case-sensitive) |
| User cannot login | Account inactive | Activate at [/admin/users](/admin/users) |
| Lost password list | Navigated away | Reset passwords individually |
| Pattern not followed | Bug/manual creation | Report to developer |

## Security Checklist

### Before Distribution

- [ ] Downloaded/copied all passwords
- [ ] Verified user count matches import
- [ ] Prepared secure distribution method
- [ ] Drafted first-login instructions
- [ ] Set calendar reminder for follow-up

### After Distribution

- [ ] Confirmed users received credentials
- [ ] Monitored first-login attempts
- [ ] Verified password changes completed
- [ ] Deleted temporary password copies
- [ ] Documented process in activity logs

### 30-Day Follow-Up

- [ ] Review unchanged passwords
- [ ] Force password resets if needed
- [ ] Deactivate unused accounts
- [ ] Audit account creation activity

## Related Pages

- **User Management**: [/admin/users](/admin/users) - User CRUD and upload
- **Change Password**: [/admin/change-password](/admin/change-password) - Password policy
- **Activity Logs**: [/admin/log](/admin/log) - Track password changes
- **Roles**: [/admin/roles](/admin/roles) - Understand role permissions
