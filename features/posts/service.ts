import { prisma } from '@/lib/db';
import { POST_STATUS } from '@/lib/status';
import { sanitizeHtml } from '@/lib/validate';
import type { CreatePostInput } from './schemas';

export async function createSkillPost(userId: number, input: CreatePostInput) {
  const safeBody = sanitizeHtml(input.body);

  return prisma.$transaction(async (tx) => {
    const post = await tx.post.create({
      data: {
        userId,
        title: input.title,
        body: safeBody,
        status: POST_STATUS.PUBLISHED,
      },
    });

    await tx.skillAsset.create({
      data: {
        postId: post.id,
        assetType: input.assetType,
        sourceUrl: input.sourceUrl,
        installHint: input.installHint,
        usageNotes: input.usageNotes,
      },
    });

    const tags = [
      { dimension: 'scene', value: input.tags.scene },
      ...(input.tags.industry ? [{ dimension: 'industry', value: input.tags.industry }] : []),
      ...input.tags.content.map((value) => ({ dimension: 'content', value })),
    ];

    await tx.postTag.createMany({
      data: tags.map((tag) => ({ ...tag, postId: post.id })),
    });

    if (input.attachmentIds.length > 0) {
      await tx.attachment.updateMany({
        where: { id: { in: input.attachmentIds }, uploaderId: userId, postId: null },
        data: { postId: post.id },
      });
    }

    return post;
  });
}
