export function getOtpEmailTemplate(otp: string, email: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f9fafb">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 480px; background-color:#ffffff; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 16px 32px; text-align: center;">
              <h2 style="margin:0; font-size:22px; color:#1f2937;">🔐 Sign in to Internet Speed Monitor</h2>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <p style="margin:0 0 16px 0; font-size:15px; color:#4b5563; line-height:1.6;">
                Use the verification code below to access your dashboard.
              </p>
              <!-- OTP Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding: 24px; background-color:#f0f7ff; border-radius:8px; border:1px solid #b9d9ff;">
                    <span style="font-size:36px; font-weight:700; letter-spacing:8px; color:#1f2937; font-family: 'Courier New', monospace;">${otp}</span>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0 0; font-size:13px; color:#9ca3af;">
                This code is valid for <strong>10 minutes</strong>. Requested for <strong>${email}</strong>.
              </p>
            </td>
          </tr>
          <!-- Divider -->
          <tr>
            <td style="padding:0 32px;">
              <hr style="border:none; border-top:1px solid #e5e7eb; margin:0;">
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px 32px 32px; text-align:center;">
              <p style="margin:0; font-size:13px; color:#9ca3af;">
                If you didn’t request this code, you can safely ignore this email.
              </p>
              <p style="margin:8px 0 0 0; font-size:12px; color:#d1d5db;">
                &copy; ${new Date().getFullYear()} Internet Speed Monitor
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}