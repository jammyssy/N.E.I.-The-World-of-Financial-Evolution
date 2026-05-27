import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { setSession } from '@/lib/session';
import { isPhone, isPassword, isCode } from '@/lib/validate';

export async function POST(req: Request) {
  const { phone, password, code, mode } = await req.json();
  if (!isPhone(phone)) return NextResponse.json({ error: '手机号格式不正确' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) return NextResponse.json({ error: '账号不存在' }, { status: 404 });

  if (mode === 'code') {
    if (!isCode(code)) return NextResponse.json({ error: '验证码格式不正确' }, { status: 400 });
    const smsCode = await prisma.smsCode.findFirst({
      where: { phone, code, consumed: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!smsCode) return NextResponse.json({ error: '验证码无效或已过期' }, { status: 400 });
    await prisma.smsCode.update({ where: { id: smsCode.id }, data: { consumed: true } });
  } else {
    if (!isPassword(password)) return NextResponse.json({ error: '密码格式不正确' }, { status: 400 });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return NextResponse.json({ error: '手机号或密码错误' }, { status: 401 });
  }

  await setSession(user.id);
  return NextResponse.json({ id: user.id, nickname: user.nickname, role: user.role });
}
