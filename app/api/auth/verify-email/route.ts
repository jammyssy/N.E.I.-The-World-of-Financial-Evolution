import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isEmail } from '@/lib/validate';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email || !isEmail(email)) {
    return NextResponse.json({ error: '请输入有效的邮箱地址' }, { status: 400 });
  }

  // Generate 6-digit code
  const code = String(Math.floor(100000 + Math.random() * 900000));

  await prisma.verificationCode.create({
    data: {
      email,
      code,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  });

  // Send email (silently skips in dev without API key)
  try {
    await sendVerificationEmail(email, code, 'register');
  } catch (err) {
    console.error('Failed to send verification email:', err);
  }

  return NextResponse.json({ ok: true, devCode: code });
}
