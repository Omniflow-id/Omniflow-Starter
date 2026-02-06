# Change Password ([/admin/change-password](/admin/change-password))

The **Change Password** page allows users to update their account password with comprehensive policy enforcement for security.

## Quick Actions

| Action | How |
|--------|-----|
| Change password | Fill form at [/admin/change-password](/admin/change-password) |
| View profile | Return to [/admin/profile](/admin/profile) |
| Check policy requirements | See table below |

## Password Change Steps

### How to Change Your Password

1. Navigate to [/admin/change-password](/admin/change-password)
2. Enter your **current password**
3. Enter your **new password** (must meet all requirements)
4. **Confirm new password** (must match)
5. Click **"Change Password"** button
6. **Success**: Redirected to profile with confirmation message

### Form Fields

| Field | Required | Validation |
|-------|----------|------------|
| **Current Password** | ✓ | Must match your existing password |
| **New Password** | ✓ | Must meet all password policy requirements |
| **Confirm Password** | ✓ | Must match new password exactly |

## Password Policy Requirements

### Complete Policy Table

| Requirement | Default Value | Configurable | Description |
|-------------|---------------|--------------|-------------|
| **Minimum Length** | 8 characters | ✓ | Shortest allowed password |
| **Maximum Length** | 128 characters | ✓ | Longest allowed password |
| **Uppercase Letters** | Required (≥ 1) | ✓ | Must contain A-Z |
| **Lowercase Letters** | Required (≥ 1) | ✓ | Must contain a-z |
| **Numbers** | Required (≥ 1) | ✓ | Must contain 0-9 |
| **Special Characters** | Required (≥ 1) | ✓ | Must contain !@#$%^&* etc |
| **Minimum Numbers** | 1 | ✓ | Minimum count of digits |
| **Minimum Symbols** | 1 | ✓ | Minimum count of special chars |
| **Max Repeating Characters** | 3 | ✓ | Max consecutive identical characters |
| **Forbidden Patterns** | Configurable | ✓ | Banned words/patterns |

### Environment Variables

Administrators can customize policy via `.env`:

```env
PASSWORD_MIN_LENGTH=8
PASSWORD_MAX_LENGTH=128
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBERS=true
PASSWORD_REQUIRE_SYMBOLS=true
PASSWORD_MIN_SYMBOLS=1
PASSWORD_MIN_NUMBERS=1
PASSWORD_MAX_REPEATING=3
PASSWORD_FORBIDDEN_PATTERNS=password,admin,12345,qwerty
```

## Password Validation Rules

### Character Type Requirements

**Uppercase Letters (A-Z):**
- At least 1 uppercase letter required
- Examples: `A`, `Z`, `M`

**Lowercase Letters (a-z):**
- At least 1 lowercase letter required
- Examples: `a`, `z`, `m`

**Numbers (0-9):**
- At least 1 number required
- Examples: `0`, `5`, `9`

**Special Characters:**
- At least 1 special character required
- Allowed: `` !@#$%^&*()_+-=[]{}|;':",./<>?`~ ``
- Examples: `!`, `@`, `#`, `$`

### Advanced Rules

**Max Consecutive Repeating Characters:**
- Maximum 3 identical characters in a row
- ✅ Good: `AAA`, `111`, `!!!`
- ❌ Bad: `AAAA`, `1111`, `!!!!`

**Forbidden Patterns:**
- Cannot contain common words (configurable)
- Default forbidden: `password`, `admin`, `12345`, `qwerty`
- Case-insensitive matching

### Password Strength Examples

**✅ Strong Passwords:**
- `MyP@ssw0rd2024` (mixed case, numbers, symbols)
- `Secure!123Pass` (meets all requirements)
- `Tr0ng#P@ssword` (good complexity)

**❌ Weak Passwords:**
- `password` (forbidden pattern)
- `12345678` (no letters, too simple)
- `Password` (missing numbers, symbols)
- `AAAAA123!` (too many repeating chars)
- `pass` (too short)

## Validation Error Messages

### Common Errors

| Error Message | Cause | Solution |
|--------------|-------|----------|
| Password must be at least 8 characters | Too short | Use minimum 8 characters |
| Password must contain uppercase | Missing A-Z | Add at least one uppercase letter |
| Password must contain lowercase | Missing a-z | Add at least one lowercase letter |
| Password must contain numbers | Missing 0-9 | Add at least one number |
| Password must contain symbols | Missing special chars | Add !@#$%^&* etc |
| Too many repeating characters | AAAA pattern | Limit consecutive repeats to 3 |
| Password contains forbidden pattern | Forbidden word | Avoid common words like "password" |
| Passwords do not match | Mismatch in confirmation | Confirm password must match new password |
| Current password incorrect | Wrong current password | Enter your correct current password |

## Generated Passwords (Admin Bulk Import)

### Password Pattern for Bulk Upload

When admins import users via Excel, passwords are auto-generated:

**Pattern:** `FullNameWithoutSpaces@12345?.`

**Examples:**
- Eric Julianto → `EricJulianto@12345?.`
- Jane Smith → `JaneSmith@12345?.`
- Ahmad Wijaya → `AhmadWijaya@12345?.`

**Policy Compliance:**
- ✅ Uppercase: First letter of each name part
- ✅ Lowercase: Remaining letters
- ✅ Numbers: `12345`
- ✅ Symbols: `@`, `?`, `.`
- ✅ Meets minimum length (8+ characters)

### Security Warnings for Generated Passwords

⚠️ **Important for New Users:**
- Generated passwords are **predictable**
- Users should **change immediately** after first login
- Admins see generated passwords in [/admin/passwords](/admin/passwords)
- **Never share** generated passwords insecurely

## Common Scenarios

### Scenario 1: Forgot Current Password

**Problem:** Cannot remember current password to change it

**Solution:**
1. Logout from your account
2. Contact system administrator
3. Admin can reset your password at [/admin/users](/admin/users)
4. Admin provides temporary password
5. Login with temporary password
6. Immediately change to your own password

**Note:** System does not support self-service password reset (security feature).

### Scenario 2: Password Rejected by Policy

**Problem:** New password keeps getting rejected

**Diagnosis:**
1. Check all requirements in policy table above
2. Review error messages carefully
3. Use password strength checker (if available)

**Solutions:**
- Ensure at least 8 characters
- Include uppercase (A-Z)
- Include lowercase (a-z)
- Include numbers (0-9)
- Include special characters (!@#$)
- Avoid repeating characters (max 3)
- Avoid forbidden words

### Scenario 3: First Login After Bulk Import

**For New Users Created by Admin:**

1. Check email/documentation for temporary password
2. Login with generated password (format: `FullName@12345?.`)
3. **Immediately navigate to** [/admin/change-password](/admin/change-password)
4. Change to your personal secure password
5. Store password securely (password manager recommended)

### Scenario 4: Regular Password Update

**Best Practice Schedule:**

1. Change password every **90 days** (recommended)
2. Navigate to [/admin/change-password](/admin/change-password)
3. Enter current password
4. Choose new strong password (different from previous)
5. Update password manager entry
6. Logout and login to verify

## Troubleshooting

| Issue | Diagnosis | Solution |
|-------|-----------|----------|
| Form validation failing | Check all policy requirements | Review error messages, ensure all rules met |
| Current password incorrect | Typo or caps lock | Verify correct password, check caps lock |
| Confirmation mismatch | Typing error | Carefully re-type confirmation password |
| Password too weak | Simple password | Add complexity: mixed case, numbers, symbols |
| Cannot access page | Not logged in | Login first, then access change password |
| Changes not saving | Server/network error | Check internet connection, try again |

## Security Best Practices

### Choosing Strong Passwords

✅ **Good Practices:**
- Use password manager to generate random passwords
- Make passwords unique per system
- Use passphrases (e.g., `Coffee$Morning2024!`)
- Mix character types throughout password
- Make passwords memorable but unpredictable

❌ **Avoid:**
- Personal information (birthdate, name, phone)
- Common patterns (123456, qwerty, password)
- Dictionary words
- Reusing passwords across systems
- Sharing passwords with anyone

### Password Maintenance

✅ **Regular Updates:**
- Change password every 90 days
- Update immediately if:
  - Suspected compromise
  - After sharing credentials (temporary access)
  - Leaving company
  - Security breach announced
  - Joining from contractor to employee

### Activity Logging

All password changes are logged to activity system:
- Timestamp of change
- User who changed password
- IP address
- Success/failure status

**View Logs:** [/admin/log](/admin/log) (admins only)

## Related Pages

- **User Profile**: [/admin/profile](/admin/profile) - View account details
- **Generated Passwords**: [/admin/passwords](/admin/passwords) - Admin bulk import passwords
- **User Management**: [/admin/users](/admin/users) - Admin user CRUD
- **Activity Logs**: [/admin/log](/admin/log) - View password change audit trail
