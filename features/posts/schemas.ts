import { z } from 'zod';
import { CONTENT_TAGS, INDUSTRY_TAGS, SCENE_TAGS, SKILL_TAGS } from '@/lib/tags';

const sceneVals: string[] = SCENE_TAGS.map((t) => t.value);
const industryVals: string[] = INDUSTRY_TAGS.map((t) => t.value);
const contentVals: string[] = CONTENT_TAGS.map((t) => t.value);
const assetTypeVals: string[] = SKILL_TAGS.map((t) => t.value);

export const postFiltersSchema = z.object({
  scene: z.string().optional(),
  industry: z.string().optional(),
  content: z.array(z.string()).default([]),
  assetType: z.string().optional(),
  skill: z.string().optional(),
  role: z.string().optional(),
  time: z.string().optional(),
  q: z.string().trim().default(''),
  page: z.coerce.number().int().positive().default(1),
});

export type PostFilters = z.infer<typeof postFiltersSchema>;

export const createPostSchema = z.object({
  title: z.string().trim().min(5, '标题需 5-100 字符').max(100, '标题需 5-100 字符'),
  body: z.string().trim().min(1, '正文长度需 1-50000 字符').max(50000, '正文长度需 1-50000 字符'),
  assetType: z.string().refine((v) => assetTypeVals.includes(v), '请选择 Skill 类型'),
  tags: z.object({
    scene: z.string().refine((v) => sceneVals.includes(v), '请选择工作场景标签'),
    industry: z
      .string()
      .nullable()
      .optional()
      .transform((v) => v || null)
      .refine((v) => !v || industryVals.includes(v), '行业标签无效'),
    content: z
      .array(z.string())
      .default([])
      .transform((arr) => [...new Set(arr.filter((v) => contentVals.includes(v)))])
      .refine((arr) => arr.length <= 3, '工作内容标签最多 3 个'),
  }),
  sourceUrl: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null)
    .refine((v) => !v || /^https?:\/\//.test(v), '来源链接需以 http:// 或 https:// 开头'),
  installHint: z
    .string()
    .trim()
    .max(2000, '安装说明最多 2000 字符')
    .optional()
    .transform((v) => v || null),
  usageNotes: z
    .string()
    .trim()
    .max(2000, '使用说明最多 2000 字符')
    .optional()
    .transform((v) => v || null),
  attachmentIds: z.array(z.coerce.number().int().positive()).default([]),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

export function parsePostFilters(params: URLSearchParams): PostFilters {
  const parsed = postFiltersSchema.parse({
    scene: params.get('scene') || undefined,
    industry: params.get('industry') || undefined,
    content: params.getAll('content'),
    assetType: params.get('assetType') || undefined,
    skill: params.get('skill') || undefined,
    role: params.get('role') || undefined,
    time: params.get('time') || undefined,
    q: params.get('q') || '',
    page: params.get('page') || '1',
  });

  return {
    ...parsed,
    scene: parsed.scene && sceneVals.includes(parsed.scene) ? parsed.scene : undefined,
    industry: parsed.industry && industryVals.includes(parsed.industry) ? parsed.industry : undefined,
    assetType:
      parsed.assetType && assetTypeVals.includes(parsed.assetType)
        ? parsed.assetType
        : parsed.skill && assetTypeVals.includes(parsed.skill)
        ? parsed.skill
        : undefined,
    role: parsed.role && ['VC', 'PE', 'FA'].includes(parsed.role) ? parsed.role : undefined,
    content: parsed.content.filter((v) => contentVals.includes(v)).slice(0, 3),
  };
}
