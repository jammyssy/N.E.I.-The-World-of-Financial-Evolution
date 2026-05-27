import { NextResponse } from 'next/server';
import { getSkillsMap } from '@/features/skills/queries';

export async function GET() {
  return NextResponse.json(await getSkillsMap());
}
