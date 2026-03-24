# New Account Registration

The **Register** page is a feature to register a new account in the Omniflow system. This feature allows new users to create their own account without needing to ask an administrator.

## Who Uses This

- **New employees** - Who don't have an account in the system yet
- **Potential users** - Who are invited to try the system
- **Contractors/outsiders** - Who are given access by internal team

## When Used

1. **New employee onboarding** - After HR gives access
2. **User trial** - Who wants to try the system
3. **Invitation registration** - Using admin invitation link
4. **Self-service registration** - If enabled by admin

## Registration Steps

### 1. Fill Form

On the register page, complete the following data:
- **Username**: Name for login (unique, cannot be duplicated)
- **Email**: Active email address (will be used for notifications)
- **Password**: Password according to security policy
- **Confirm Password**: Repeat the same password

### 2. Validate Data

System will validate:
- Correct email format
- Username not already used
- Password meets policy (length, characters)
- Password and confirmation match

### 3. Verification (If Enabled)

If admin has enabled email verification:
- Verification link sent to email
- Click link to activate account
- Only then can log in

### 4. Account Activation

After success:
- Account directly active (if without email verification)
- Or after clicking verification link
- Ready to log in

## Password Policy

Password must meet requirements:
- Minimum 8 characters
- Contains uppercase letters (A-Z)
- Contains lowercase letters (a-z)
- Contains numbers (0-9)
- Contains special characters (!@#$%^&*)

## Error Messages and Solutions

| Error Message | Cause | Solution |
|---------------|-------|----------|
| Email already registered | Email exists in system | Use other email or contact admin |
| Username already used | Name used by other user | Choose different unique username |
| Password doesn't match | Password and confirmation different | Ensure both are exactly the same |
| Password too weak | Doesn't meet password policy | Use more complex combination |
| Invalid email format | Email format not valid | Enter email with correct format |

## Registration Security

### Email Verification

To prevent fake accounts:
- Verification link sent to email
- Click activation within certain time
- If not clicked, account cannot log in

### Spam Prevention

- Using CAPTCHA (if enabled)
- Rate limiting to prevent mass registration
- Manual moderation for certain types

## If Cannot Register

### Possible Reasons

1. **Registration disabled** - Admin hasn't enabled this feature
2. **By invitation only** - Requires link from admin
3. **Domain restricted** - Only certain emails allowed
4. **Quota full** - Number of users has reached limit

### Solutions

- Contact administrator to request account
- If invitation exists, use that link
- Wait if system is under maintenance

## After Successful Registration

### Next Steps

1. **Log in** to system with new credentials
2. **Complete profile** - Full name, department, etc.
3. **Change password** - If using temporary password
4. **Learn the system** - Follow orientation if available

### If Using Invitation Link

- Account already connected to specific team/department
- No need to input additional information
- Can access features directly according to role

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Cannot access register page | Feature may be disabled, contact admin |
| Verification link doesn't work | Check email again, might be in spam, request resend |
| Email doesn't receive link | Contact admin for manual activation |
| Stuck in verification process | Refresh page, if still stuck try again from start |

## Difference with Admin-Created Accounts

| Aspect | Self-Service Register | Admin-Created Account |
|--------|----------------------|----------------------|
| Creation | By user themselves | By administrator |
| Password | User-defined | Can be auto-generated |
| Verification | Through email (usually) | Directly active |
| Role | Default only | According to needs |

## Related Links

- [Login Page](/admin/login) - If already have account
- [Contact Admin](/admin/support) - If experiencing issues