# OTP Code Verification

The **OTP Verification** page is the second security step in the Omniflow login process. After successfully verifying your password, you will be asked to enter a verification code sent to your email.

## Who Uses This

- **All logging in users** - Anyone who successfully verifies password will go through this step
- **Active account users** - Accounts that are not deactivated
- **First-time login users** - After password reset, still need 2FA verification

## When Used

1. **Normal login** - After password is successfully verified
2. **Login after password reset** - Using new password
3. **Login from new device** - System detects new device
4. **Session expire** - After session timeout, re-login requires OTP

## How to Use

### 1. Check Email

After being redirected to OTP verification page:
- Open your email inbox
- Look for email from Omniflow system
- OTP code consists of 6 digits

### 2. Enter Code

- Type 6-digit OTP code in the provided field
- Make sure there are no spaces between numbers
- Click "Verify" button or press Enter

### 3. Wait for Process

- System verifies code in seconds
- If correct, you will be redirected to dashboard
- If incorrect, error message appears

## OTP Time Limit

### Validity Period

- **Duration**: 5 minutes since code was sent
- **Timer display**: System shows remaining time available
- **Expired handling**: If expired, must login from the beginning

### If OTP Expires

1. You will be redirected to login page
2. Must enter email and password again
3. New OTP code will be sent to email

## Error Messages and Solutions

| Error Message | Cause | Solution |
|---------------|-------|----------|
| Invalid OTP code | Entered wrong code or already expired | Check latest code in email, don't use old code |
| OTP already expired | Exceeded 5 minutes | Login again to get new code |
| Too many attempts | Entered wrong code multiple times | Wait 5 minutes, try again |
| Session not found | Page refresh or invalid navigation | Login again from the beginning |

## Security Mechanism

### Why OTP is Required?

- **Additional security layer** - Even if password is leaked, account is still safe
- **Email ownership verification** - Ensures access by legitimate account owner
- **Prevent unauthorized access** - Attackers must also have access to email

### OTP Security

- Code is unique and random
- Only valid for one login session
- Cannot be reused
- Different code for each login attempt

## Security Tips

### ✅ Good Practices

- Never share OTP code with anyone
- System will never ask for OTP code via phone
- If you receive unrequested OTP email, immediately report to admin
- Change password regularly for extra security

### ❌ Things to Avoid

- Don't give OTP code to people claiming to be support
- Don't enter code on websites other than official Omniflow
- Don't forward OTP email to others
- Don't screenshot OTP code

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Not receiving OTP email | Check spam/junk folder, ensure email is correct, contact admin |
| OTP email goes to promo/spam | Check email settings, mark sender as trusted |
| Timer runs out before entering | Click "Resend OTP" to get new code |
| Entering wrong code multiple times | Wait 5 minutes, ensure input is correct before submitting |
| Stuck on this page | Refresh browser, if still issues logout and login again |

## Development (Dev Mode)

### Bypass Feature for Development

In development environment, administrator can enable 2FA bypass feature:
- If active, OTP code is not required
- User enters directly after password verification
- Usually for testing or demo purposes

**Important Note**: This feature should NOT be enabled in production environment as it reduces security.

## Related Links

- [Login Page](/admin/login) - To start login process
- [Contact Admin](/admin/support) - If experiencing verification issues
- [Change Password](/admin/change-password) - After successful login