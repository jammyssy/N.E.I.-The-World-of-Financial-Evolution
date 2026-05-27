import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isPhone } from '@/lib/validate';

// MVP：固定返回验证码 123456，写入 DB 验证。生产应接入短信网关。
export async function POST(req: Request) {
  const { phone } = await req.json();
  if (!phone || !isPhone(phone)) {
    return NextResponse.json({ error: '手机号格式不正确' }, { status: 400 });
  }
  const code = '123456';
  await prisma.smsCode.create({
    data: {
      phone,
      code,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  });
  return NextResponse.json({ ok: true, devCode: code });
}
