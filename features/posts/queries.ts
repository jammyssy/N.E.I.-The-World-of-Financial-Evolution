import { prisma } from '@/lib/db';
import { POST_STATUS } from '@/lib/status';
import { postToDetailDto, postToListItemDto } from './mapper';
import type { PostFilters } from './schemas';

const PAGE_SIZE = 20;

function buildWhere(filters: PostFilters) {
  const and: any[] = [];

  if (filters.scene) and.push({ tags: { some: { dimension: 'scene', value: filters.scene } } });
  if (filters.industry) and.push({ tags: { some: { dimension: 'industry', value: filters.industry } } });
  for (const content of filters.content) {
    and.push({ tags: { some: { dimension: 'content', value: content } } });
  }
  if (filters.assetType) and.push({ skillAsset: { is: { assetType: filters.assetType } } });
  if (filters.role) and.push({ author: { role: filters.role } });

  if (filters.time) {
    const days = filters.time === '7d' ? 7 : filters.time === '30d' ? 30 : filters.time === '90d' ? 90 : 0;
    if (days > 0) and.push({ createdAt: { gte: new Date(Date.now() - days * 86400000) } });
  }

  if (filters.q) {
    and.push({
      OR: [
        { title: { contains: filters.q } },
        { body: { contains: filters.q } },
        { author: { nickname: { contains: filters.q } } },
      ],
    });
  }

  return and.length > 0 ? { status: POST_STATUS.PUBLISHED, AND: and } : { status: POST_STATUS.PUBLISHED };
}

async function getViewerSets(userId: number | null, postIds: number[]) {
  if (!userId || postIds.length === 0) return { likedIds: new Set<number>(), favoritedIds: new Set<number>() };

  const [likes, favs] = await Promise.all([
    prisma.postLike.findMany({ where: { userId, postId: { in: postIds } }, select: { postId: true } }),
    prisma.postFavorite.findMany({ where: { userId, postId: { in: postIds } }, select: { postId: true } }),
  ]);

  return {
    likedIds: new Set(likes.map((like) => like.postId)),
    favoritedIds: new Set(favs.map((fav) => fav.postId)),
  };
}

export async function listPosts(filters: PostFilters, viewerId: number | null, take = PAGE_SIZE) {
  const posts = await prisma.post.findMany({
    where: buildWhere(filters),
    include: {
      author: { select: { id: true, nickname: true, role: true, avatarUrl: true } },
      skillAsset: true,
      tags: true,
      _count: { select: { comments: true, likes: true, attachments: true } },
    },
    orderBy: { createdAt: 'desc' },
    skip: (filters.page - 1) * take,
    take,
  });

  const viewer = await getViewerSets(
    viewerId,
    posts.map((post) => post.id)
  );

  return {
    items: posts.map((post) => postToListItemDto(post, viewer)),
    page: filters.page,
    hasMore: posts.length === take,
  };
}

export async function getPostDetail(id: number, viewerId: number | null, incrementView = false) {
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, nickname: true, role: true, avatarUrl: true } },
      skillAsset: true,
      tags: true,
      attachments: { where: { postId: id }, orderBy: { createdAt: 'asc' } },
      _count: { select: { comments: true, likes: true, favorites: true, attachments: true } },
    },
  });

  if (!post || post.status !== POST_STATUS.PUBLISHED) return null;
  if (incrementView) await prisma.post.update({ where: { id }, data: { viewCount: { increment: 1 } } });

  const viewer = await getViewerSets(viewerId, [id]);
  return postToDetailDto(post, viewer);
}

export async function listUserPosts(profileId: number, viewerId: number | null, tab: string, isOwner: boolean) {
  let posts: any[] = [];

  if (tab === 'posts') {
    posts = await prisma.post.findMany({
      where: isOwner ? { userId: profileId } : { userId: profileId, status: POST_STATUS.PUBLISHED },
      include: {
        author: { select: { id: true, nickname: true, role: true, avatarUrl: true } },
        skillAsset: true,
        tags: true,
        _count: { select: { comments: true, likes: true, attachments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  } else if (tab === 'likes') {
    const likes = await prisma.postLike.findMany({
      where: { userId: profileId },
      include: {
        post: {
          include: {
            author: { select: { id: true, nickname: true, role: true, avatarUrl: true } },
            skillAsset: true,
            tags: true,
            _count: { select: { comments: true, likes: true, attachments: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    posts = likes.filter((like) => like.post.status === POST_STATUS.PUBLISHED).map((like) => like.post);
  } else if (tab === 'favorites') {
    const favs = await prisma.postFavorite.findMany({
      where: { userId: profileId },
      include: {
        post: {
          include: {
            author: { select: { id: true, nickname: true, role: true, avatarUrl: true } },
            skillAsset: true,
            tags: true,
            _count: { select: { comments: true, likes: true, attachments: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    posts = favs.filter((fav) => fav.post.status === POST_STATUS.PUBLISHED).map((fav) => fav.post);
  }

  const viewer = await getViewerSets(
    viewerId,
    posts.map((post) => post.id)
  );
  return posts.map((post) => postToListItemDto(post, viewer));
}
