import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM || 'PEVC Codex <onboarding@resend.dev>';

export async function sendVerificationEmail(email: string, code: string, purpose: 'register' | 'login') {
  const subject = purpose === 'register'
    ? 'PEVC Codex · 验证你的邮箱'
    : 'PEVC Codex · 登录验证码';

  const html = `
    <div style="font-family: serif; max-width: 480px; margin: 0 auto; padding: 32px; color: #3D2E1F;">
      <h2 style="font-size: 20px; margin-bottom: 24px;">${subject}</h2>
      <p style="font-size: 15px; margin-bottom: 16px;">你的验证码是：</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 16px; background: #FAF6EC; border: 1px solid #E4DAC4; text-align: center; font-family: monospace;">
        ${code}
      </div>
      <p style="font-size: 13px; color: #8B6F4E; margin-top: 24px;">
        验证码 5 分钟内有效。如果这不是你的操作，请忽略此邮件。
      </p>
    </div>
  `;

  // In development without RESEND_API_KEY, skip sending but don't error
  if (!process.env.RESEND_API_KEY) {
    console.log(`[DEV] Verification code for ${email}: ${code}`);
    return { id: 'dev-skipped' };
  }

  return resend.emails.send({
    from: FROM,
    to: email,
    subject,
    html,
  });
}
