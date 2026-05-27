import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { setSession } from '@/lib/session';
import { isPhone, isNickname, isPassword, isCode, hasSensitive } from '@/lib/validate';

const VALID_ROLES = ['VC', 'PE', 'FA'];

export async function POST(req: Request) {
  const { phone, code, role, nickname, password } = await req.json();

  if (!isPhone(phone)) return NextResponse.json({ error: '手机号格式不正确' }, { status: 400 });
  if (!isCode(code)) return NextResponse.json({ error: '验证码格式不正确' }, { status: 400 });
  if (!VALID_ROLES.includes(role)) return NextResponse.json({ error: '请选择身份' }, { status: 400 });
  if (!isNickname(nickname)) return NextResponse.json({ error: '昵称需 2-20 字符' }, { status: 400 });
  if (hasSensitive(nickname)) return NextResponse.json({ error: '昵称包含敏感词' }, { status: 400 });
  if (!isPassword(password)) return NextResponse.json({ error: '密码需 8-20 位，含字母和数字' }, { status: 400 });

  // 校验短信验证码
  const smsCode = await prisma.smsCode.findFirst({
    where: { phone, code, consumed: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!smsCode) return NextResponse.json({ error: '验证码无效或已过期' }, { status: 400 });

  // 唯一性
  const exists = await prisma.user.findFirst({
    where: { OR: [{ phone }, { nickname }] },
  });
  if (exists) {
    if (exists.phone === phone) return NextResponse.json({ error: '该手机号已注册' }, { status: 409 });
    return NextResponse.json({ error: '昵称已被使用' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { phone, role, nickname, passwordHash },
  });

  await prisma.smsCode.update({ where: { id: smsCode.id }, data: { consumed: true } });
  await setSession(user.id);

  return NextResponse.json({ id: user.id, nickname: user.nickname, role: user.role });
}
