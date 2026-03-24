# Login Process

The **Login** page is the main entry point to access the Omniflow system. This page handles user authentication with layered security using password and two-factor authentication (2FA).

## Who Uses This

- **All system users** - Employees, managers, administrators with accounts in Omniflow
- **New users** - Employees newly registered by the administrator
- **Contractors/outsiders** - External parties given temporary access to the system

## When Used

1. **First access** - First time entering the system after account creation
2. **Session ends** - After logout or session timeout (24 hours inactive)
3. **Login from new device** - Accessing from a new browser/device
4. **Password reset** - After administrator resets password, user must log in again

## Login Steps

### 1. Enter Credentials

On the login page, enter:
- **Email**: Email address registered in the system
- **Password**: Your account password

### 2. Verify Password

The system will verify:
- Email is registered in the system
- Password matches what's stored
- Account is active

### 3. Two-Factor Authentication (2FA)

If password is correct, the system will send an OTP code to your email:
- OTP is sent automatically after password verification
- You will be redirected to the OTP verification page
- Enter the 6-digit code sent to your email

### 4. Access System

After OTP is verified, you will be redirected to the main page (dashboard).

## Error Messages and Solutions

| Error Message | Cause | Solution |
|---------------|-------|----------|
| Incorrect email or password | Email not registered or wrong password | Check email and password, contact admin if forgotten |
| Account inactive | Account deactivated by administrator | Contact administrator for reactivation |
| Too many login attempts | Rate limit reached | Wait 15 minutes, try again |
| Session ended | Idle too long | Log in again |

## Login Security

### Protections Applied

1. **Password encryption** - Passwords stored with strong encryption (bcrypt)
2. **Two-Factor Authentication** - OTP code sent to email for additional verification
3. **Rate limiting** - Prevents brute force attempts by limiting login attempts
4. **Activity logging** - All login attempts (success/failure) recorded for audit

### Security Best Practices

✅ **Do:**
- Use unique passwords not used on other systems
- Never share login credentials
- Log out when leaving computer
- Report suspicious activities immediately

❌ **Avoid:**
- Saving passwords in browser (especially on shared computers)
- Logging in from public WiFi without VPN
- Using "remember me" button on shared computers
- Ignoring security warnings

## Session Settings

### Session Duration

- **Lifetime**: 24 hours (if no activity)
- **Auto-renewal**: Session extended automatically when there's activity
- **Timeout warning**: Appears 2 minutes before session ends

### Session Security Mechanism

- Every activity (click, input) updates the session timer
- Session tied to browser and IP address
- If IP changes significantly, session ends

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Not receiving OTP email | Check spam folder, ensure email is correct, contact admin if still issues |
| Email not registered | Contact administrator to register account |
| Forgot password | Contact administrator to reset password |
| Account locked | Contact administrator to unlock |
| Cannot log in at all | Verify account status with administrator |

## Integration with Other Features

### After Successful Login

- **Permissions loaded** - System loads access rights based on your role
- **Redirect to dashboard** - You enter the main page according to your role
- **Activity recorded** - Login activity created for audit trail

### If Login Fails

- Failed attempts recorded with IP and time details
- Admin can view login history in Activity Logs
- If too many failures, account may need admin verification

## Additional Information

### Default Accounts (For Testing)

If you are using a development environment with bypass feature active, you can log in with default accounts:
- admin@omniflow.id / Admin12345
- manager@omniflow.id / Manager12345
- user@omniflow.id / User12345

**Note**: Bypass accounts are only active in development environment, not in production.

### Browser Support

The system supports modern browsers:
- Chrome (latest version)
- Firefox (latest version)
- Safari (latest version)
- Edge (latest version)

## Related Links

- [OTP Verification](/admin/verify-otp) - OTP code entry page
- [Forgot Password](/admin/forgot-password) - Password reset process (if enabled)
- [Contact Admin](/admin/support) - If experiencing login issues