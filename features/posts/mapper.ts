import { stripHtml } from '@/lib/validate';

type ViewerState = {
  likedIds?: Set<number>;
  favoritedIds?: Set<number>;
};

export type PostTagsDto = {
  scene: string;
  industry: string | null;
  content: string[];
};

export type SkillAssetDto = {
  id: number;
  assetType: string;
  sourceUrl: string | null;
  installHint: string | null;
  usageNotes: string | null;
};

export type PostListItemDto = {
  id: number;
  title: string;
  excerpt: string;
  body?: string;
  tags: PostTagsDto;
  skillAsset: SkillAssetDto | null;
  createdAt: string;
  viewCount: number;
  author: { id: number; nickname: string; role: string; avatarUrl?: string | null };
  counts: { comments: number; likes: number; attachments: number };
  viewerState: { liked: boolean; favorited: boolean };
};

export type AttachmentDto = {
  id: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  downloadCount: number;
  createdAt: string;
};

export type PostDetailDto = PostListItemDto & {
  body: string;
  attachments: AttachmentDto[];
};

export function tagsToDto(tags: Array<{ dimension: string; value: string }>): PostTagsDto {
  return {
    scene: tags.find((tag) => tag.dimension === 'scene')?.value ?? '',
    industry: tags.find((tag) => tag.dimension === 'industry')?.value ?? null,
    content: tags.filter((tag) => tag.dimension === 'content').map((tag) => tag.value),
  };
}

export function skillAssetToDto(asset: any): SkillAssetDto | null {
  if (!asset) return null;
  return {
    id: asset.id,
    assetType: asset.assetType,
    sourceUrl: asset.sourceUrl,
    installHint: asset.installHint,
    usageNotes: asset.usageNotes,
  };
}

export function postToListItemDto(post: any, viewer: ViewerState = {}): PostListItemDto {
  return {
    id: post.id,
    title: post.title,
    excerpt: stripHtml(post.body).slice(0, 160),
    tags: tagsToDto(post.tags ?? []),
    skillAsset: skillAssetToDto(post.skillAsset),
    createdAt: post.createdAt instanceof Date ? post.createdAt.toISOString() : post.createdAt,
    viewCount: post.viewCount,
    author: post.author,
    counts: {
      comments: post._count?.comments ?? post.commentCount ?? 0,
      likes: post._count?.likes ?? 0,
      attachments: post._count?.attachments ?? post.attachments?.length ?? 0,
    },
    viewerState: {
      liked: viewer.likedIds?.has(post.id) ?? false,
      favorited: viewer.favoritedIds?.has(post.id) ?? false,
    },
  };
}

export function postToDetailDto(post: any, viewer: ViewerState = {}): PostDetailDto {
  return {
    ...postToListItemDto(post, viewer),
    body: post.body,
    attachments: (post.attachments ?? []).map((a: any) => ({
      id: a.id,
      fileName: a.fileName,
      fileSize: a.fileSize,
      mimeType: a.mimeType,
      downloadCount: a.downloadCount,
      createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
    })),
  };
}
