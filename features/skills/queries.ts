import { prisma } from '@/lib/db';
import { SCENE_TAGS, SKILL_TAGS } from '@/lib/tags';
import { postToListItemDto, tagsToDto } from '@/features/posts/mapper';

export type SkillsMapCell = {
  scene: string;
  assetType: string;
  count: number;
  featured: {
    id: number;
    title: string;
    author: { nickname: string; role: string };
  } | null;
};

export async function getSkillsMap() {
  const posts = await prisma.post.findMany({
    where: { status: 'published', skillAsset: { isNot: null } },
    include: {
      author: { select: { id: true, nickname: true, role: true, avatarUrl: true } },
      skillAsset: true,
      tags: true,
      _count: { select: { comments: true, likes: true, attachments: true } },
    },
    orderBy: [{ createdAt: 'desc' }],
  });

  const grouped = new Map<string, typeof posts>();
  for (const post of posts) {
    if (!post.skillAsset) continue;
    const tags = tagsToDto(post.tags);
    if (!tags.scene) continue;
    const key = `${tags.scene}::${post.skillAsset.assetType}`;
    grouped.set(key, [...(grouped.get(key) ?? []), post]);
  }

  const cells: SkillsMapCell[] = [];
  for (const scene of SCENE_TAGS) {
    for (const skill of SKILL_TAGS) {
      const key = `${scene.value}::${skill.value}`;
      const items = grouped.get(key) ?? [];
      const featured = items[0];
      cells.push({
        scene: scene.value,
        assetType: skill.value,
        count: items.length,
        featured: featured
          ? {
              id: featured.id,
              title: featured.title,
              author: { nickname: featured.author.nickname, role: featured.author.role },
            }
          : null,
      });
    }
  }

  return {
    cells,
    totalAssets: posts.length,
    latest: posts.slice(0, 6).map((post) => postToListItemDto(post)),
  };
}
