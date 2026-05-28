import { prisma } from '@/lib/db';
import { POST_STATUS } from '@/lib/status';
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

export type SkillsMapStats = {
  totalAssets: number;
  activeScenes: number;
  topAssetType: { value: string; label: string; count: number } | null;
};

export async function getSkillsMap() {
  const posts = await prisma.post.findMany({
    where: { status: POST_STATUS.PUBLISHED, skillAsset: { isNot: null } },
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

  // Build cells
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

  // Compute stats
  const activeSceneValues = new Set<string>();
  for (const post of posts) {
    if (!post.skillAsset) continue;
    const tags = tagsToDto(post.tags);
    if (tags.scene) activeSceneValues.add(tags.scene);
  }

  const assetTypeCounts = new Map<string, number>();
  for (const post of posts) {
    if (!post.skillAsset) continue;
    const t = post.skillAsset.assetType;
    assetTypeCounts.set(t, (assetTypeCounts.get(t) ?? 0) + 1);
  }
  let topAssetType: SkillsMapStats['topAssetType'] = null;
  for (const [value, count] of assetTypeCounts) {
    if (!topAssetType || count > topAssetType.count) {
      const tag = SKILL_TAGS.find((s) => s.value === value);
      topAssetType = { value, label: tag?.label ?? value, count };
    }
  }

  const stats: SkillsMapStats = {
    totalAssets: posts.length,
    activeScenes: activeSceneValues.size,
    topAssetType,
  };

  return {
    cells,
    stats,
    latest: posts.slice(0, 6).map((post) => postToListItemDto(post)),
  };
}
