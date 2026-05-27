import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

type TagInput = {
  scene: string;
  industry?: string | null;
  content?: string[];
};

type SkillSeed = {
  userIndex: number;
  title: string;
  body: string;
  assetType: string;
  tags: TagInput;
  sourceUrl?: string;
  installHint?: string;
  usageNotes?: string;
};

async function createSkillAsset(seed: SkillSeed, users: { id: number }[]) {
  const post = await prisma.post.create({
    data: {
      userId: users[seed.userIndex].id,
      title: seed.title,
      body: seed.body,
      status: 'published',
    },
  });

  await prisma.skillAsset.create({
    data: {
      postId: post.id,
      assetType: seed.assetType,
      sourceUrl: seed.sourceUrl,
      installHint: seed.installHint,
      usageNotes: seed.usageNotes,
    },
  });

  const tags = [
    { dimension: 'scene', value: seed.tags.scene },
    ...(seed.tags.industry ? [{ dimension: 'industry', value: seed.tags.industry }] : []),
    ...(seed.tags.content ?? []).map((value) => ({ dimension: 'content', value })),
  ];

  await prisma.postTag.createMany({
    data: tags.map((tag) => ({ ...tag, postId: post.id })),
  });

  return post;
}

async function main() {
  console.log('🌱 开始种子数据…');

  await prisma.downloadEvent.deleteMany();
  await prisma.commentLike.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.postLike.deleteMany();
  await prisma.postFavorite.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.postTag.deleteMany();
  await prisma.skillAsset.deleteMany();
  await prisma.post.deleteMany();
  await prisma.smsCode.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash('password123', 10);

  const users = await Promise.all([
    prisma.user.create({
      data: { phone: '13800138001', nickname: '清流VC合伙人', role: 'VC', passwordHash: hash },
      select: { id: true },
    }),
    prisma.user.create({
      data: { phone: '13800138002', nickname: 'PE研究员小李', role: 'PE', passwordHash: hash },
      select: { id: true },
    }),
    prisma.user.create({
      data: { phone: '13800138003', nickname: 'FA-王经理', role: 'FA', passwordHash: hash },
      select: { id: true },
    }),
    prisma.user.create({
      data: { phone: '13800138004', nickname: 'AI赛道分析师', role: 'VC', passwordHash: hash },
      select: { id: true },
    }),
  ]);

  console.log('✅ 已创建 4 个用户（密码均为 password123）');

  const seeds: SkillSeed[] = [
    {
      userIndex: 3,
      title: 'AI Agent 项目初筛 Workflow：从 Demo 到投资判断的 6 步法',
      assetType: 'workflow',
      tags: { scene: 'screening', industry: 'ai-saas', content: ['risk-id', 'memo'] },
      usageNotes: '适合在项目初会后 30 分钟内完成快速判断，输出是否进入深度尽调的建议。',
      body: `<p>在过去半年里，我看了 70+ AI Agent 方向的项目，沉淀了一套快速筛选的 SOP。</p>
<h2>核心流程</h2>
<ol><li>定义可投性：商业闭环、数据飞轮和预算归属</li><li>拆解 Demo：用户任务、工具调用、失败处理</li><li>判断 Wrapper 风险：模型依赖、工作流深度、客户粘性</li><li>核对技术成本：推理成本、延迟、上下文管理</li><li>访谈客户：是否进入真实业务系统</li><li>形成 IC 前置判断：继续、观察或放弃</li></ol>
<blockquote>典型红旗：90% 收入来自 Top 3 客户、技术栈完全依赖单一供应商、护城河等于 prompt engineering。</blockquote>`,
    },
    {
      userIndex: 1,
      title: 'DCF 估值模型 Template：8 个常见坑的修正版',
      assetType: 'template',
      tags: { scene: 'financial', content: ['data-clean'] },
      usageNotes: '适合 PE 研究员在建模复核时使用，附件可替换为正式 Excel 模板。',
      body: `<p>做了 50 多个项目的 DCF 之后，总结了最容易被忽视的 8 个错误，并整理成模板。</p>
<h2>模板检查项</h2>
<ul><li>终值占比是否超过 75%</li><li>WACC 是否机械套用行业平均</li><li>增长率是否有 S 曲线衰减</li><li>营运资本和资本开支假设是否互相匹配</li></ul>
<p>使用方法：先填经营假设，再跑敏感性分析，最后看估值区间是否由单一参数主导。</p>`,
    },
    {
      userIndex: 0,
      title: 'IC 立项报告 Prompt：VC 内部投委会材料生成器',
      assetType: 'prompt',
      tags: { scene: 'ic', industry: 'ai-saas', content: ['memo', 'report-gen'] },
      installHint: '复制正文里的 Prompt 到 ChatGPT / Claude，替换项目输入信息即可使用。',
      usageNotes: '建议先让模型生成第一稿，再由投资经理补充关键风险和反方观点。',
      body: `<p>把投委会立项材料的撰写流程拆成了一个结构化 Prompt，可直接用于 Claude / ChatGPT。</p>
<h2>完整 Prompt</h2>
<pre><code>你是一位资深 VC 投委会成员。请基于以下输入信息，按照「定位 → 市场 → 团队 → 风险 → 退出」结构生成一份不超过 1500 字的立项报告。请明确列出 3 个支持投资的理由、3 个反对投资的理由，以及需要继续尽调的问题清单。</code></pre>`,
    },
    {
      userIndex: 2,
      title: 'BioTech 路演材料 Checklist：FA 视角的 BP 复核清单',
      assetType: 'case-study',
      tags: { scene: 'fundraising', industry: 'biotech', content: ['doc-parse'] },
      usageNotes: '适合融资启动前对 BP / IM 做最后一轮质量检查。',
      body: `<p>作为生物医药方向的 FA，路演前我们会对 BP 做一轮 Checklist 复核。这里是一个真实项目改写后的精简版。</p>
<h2>必备模块</h2>
<ol><li>科学故事：mechanism + clinical unmet need</li><li>管线进度：IND / Phase I/II/III 时间表</li><li>BD 比较表：Top 3 竞品最近交易对价</li><li>资金计划：next milestone 所需金额与时间</li></ol>
<p>常见缺失项：80% 的早期 BP 缺少 Plan B 叙事。</p>`,
    },
    {
      userIndex: 3,
      title: 'Claude SKILL.md：自动生成赛道扫描报告',
      assetType: 'agent-skill',
      tags: { scene: 'industry-research', industry: 'ai-saas', content: ['automation', 'report-gen', 'info-gather'] },
      sourceUrl: 'https://github.com/example/pevc-sector-scan-skill',
      installHint: '将 SKILL.md 放入本地 AI 编程助手 skills 目录，并配置数据源 API Key。',
      usageNotes: '适合每周固定生成赛道扫描报告，人工补充一线访谈和非公开数据。',
      body: `<p>过去一周我把行业扫描的标准流程接入了 Claude Skills。原来需要 3 小时的工作量现在 20 分钟搞定。</p>
<h2>工作流拆解</h2>
<ol><li>输入：赛道关键词 + 时间窗口</li><li>抓取：公开融资和新闻数据</li><li>分类：按融资轮次、地域、商业模式聚合</li><li>生成：结构化 Markdown 报告 + 关键洞察</li></ol>`,
    },
    {
      userIndex: 0,
      title: '投后董事会 Tool Stack：月报、看板和会议节奏组合',
      assetType: 'tool-stack',
      tags: { scene: 'post-investment', content: ['company-profile', 'risk-id'] },
      usageNotes: '适合投后团队帮助被投 CEO 建立稳定汇报节奏。',
      body: `<p>投后管理的痛点之一是被投 CEO 报喜不报忧、月报拖延。我们用一套工具组合把节奏变成默认行为。</p>
<h2>推荐组合</h2>
<ul><li>Notion：董事会材料沉淀</li><li>Google Sheets：核心经营指标看板</li><li>Slack / 飞书：风险事项升级</li><li>日历自动化：每月 25 日提交报表，次月 5 日董事会</li></ul>`,
    },
    {
      userIndex: 1,
      title: '并购标的舆情抓取 API Script：生成风险摘要',
      assetType: 'api-script',
      tags: { scene: 'business-dd', industry: 'consumer', content: ['info-gather', 'risk-id', 'automation'] },
      installHint: '需要 Node.js 18+，配置 NEWS_API_KEY 后运行脚本。',
      usageNotes: '适合商业尽调早期发现品牌、渠道、监管、诉讼相关风险。',
      body: `<p>这个脚本会抓取目标公司及核心品牌近 180 天的公开新闻，并生成风险摘要。</p>
<pre><code>NEWS_API_KEY=xxx node scripts/company-risk-scan.js "目标公司名称"</code></pre>
<p>输出包括高频关键词、负面事件、监管线索和建议继续访谈的问题。</p>`,
    },
  ];

  const posts = [];
  for (const seed of seeds) {
    posts.push(await createSkillAsset(seed, users));
  }

  console.log(`✅ 已创建 ${posts.length} 个 Skill Asset`);

  await prisma.postLike.createMany({
    data: [
      { userId: users[1].id, postId: posts[0].id },
      { userId: users[2].id, postId: posts[0].id },
      { userId: users[3].id, postId: posts[0].id },
      { userId: users[0].id, postId: posts[1].id },
      { userId: users[3].id, postId: posts[2].id },
      { userId: users[1].id, postId: posts[4].id },
    ],
  });
  await prisma.postFavorite.createMany({
    data: [
      { userId: users[0].id, postId: posts[1].id },
      { userId: users[2].id, postId: posts[2].id },
      { userId: users[1].id, postId: posts[4].id },
    ],
  });

  const c1 = await prisma.comment.create({
    data: {
      postId: posts[0].id,
      userId: users[1].id,
      body: '第三步「Wrapper 风险」展开讲讲？最近看了几个项目都卡在这个问题上。',
    },
  });
  await prisma.comment.create({
    data: {
      postId: posts[0].id,
      userId: users[3].id,
      parentId: c1.id,
      body: '@PE研究员小李 这部分我下篇单独写，建议重点看客户工作流嵌入深度。',
    },
  });
  await prisma.comment.create({
    data: {
      postId: posts[2].id,
      userId: users[1].id,
      body: '试了一下，配合 thinking 模式效果更好，反方观点需要明确要求模型给证据。',
    },
  });

  for (const post of posts) {
    const cnt = await prisma.comment.count({ where: { postId: post.id } });
    await prisma.post.update({ where: { id: post.id }, data: { commentCount: cnt } });
  }

  console.log('✅ 已创建评论 / 点赞 / 收藏演示数据');
  console.log('\n🎉 完成！可用测试账号：');
  console.log('  手机 13800138001 (VC) / 13800138002 (PE) / 13800138003 (FA) / 13800138004 (VC)');
  console.log('  密码：password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
