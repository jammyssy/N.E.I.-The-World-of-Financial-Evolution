/**
 * 导入开源 Claude Skills 作为种子内容。
 *
 * 来源：anthropics/financial-services (Apache-2.0)
 * 定位：把高质量、对 PE/VC 群友有用的官方 skill 搬进社区，
 *       中文标题+介绍，SKILL.md 原文作为附件保留（不破坏 skill）。
 *
 * 用法（在 repo 根目录）：
 *   1. git clone --depth 1 https://github.com/anthropics/financial-services.git /tmp/fs-skills
 *   2. npx tsx scripts/import-skills.ts
 *
 * 幂等：按 sourceRepo + skillName 去重，重复运行不会重复灌。
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { saveBuffer } from '../lib/storage';

const prisma = new PrismaClient();

/** 搬运者账号 —— 所有导入 skill 的作者 */
const LIBRARY_USER = {
  email: 'library@pevc.local',
  nickname: 'Skill 图书馆',
  role: 'VC',
  avatarUrl: null,
};

/** Apache-2.0 NOTICE，每个帖子的来源标注 */
const SOURCE_NOTICE = (skillName: string) => `
<hr>
<p style="font-size:12px;color:#8b7355">
📦 <strong>来源</strong>：Anthropic 官方 <code>financial-services</code> 仓库的
<code>${skillName}</code> skill（<code>/plugins/vertical-plugins/private-equity/</code>）<br>
📜 <strong>许可</strong>：Apache License 2.0 · 允许分享与修改，需保留来源声明<br>
🔧 <strong>用法</strong>：SKILL.md 是给 Claude Code 读的结构化指令，下载后放进
<code>~/.claude/skills/</code> 即可调用。不会用？看上方「怎么用」说明。
</p>`;

type SkillMeta = {
  /** SKILL.md 在本地 clone 的相对路径 */
  mdPath: string;
  /** skill 的内部 name（来自 frontmatter，用于幂等去重） */
  skillName: string;
  /** 中文标题 */
  title: string;
  /** 中文介绍正文（HTML） */
  intro: string;
  /** 映射到 SCENE_TAGS 的 value */
  scene: string;
  /** 映射到 INDUSTRY_TAGS，可选 */
  industry?: string;
  /** 映射到 CONTENT_TAGS，可选 */
  contents?: string[];
  /** assetType（这些全是 agent-skill / SKILL.md） */
  assetType: string;
};

const SKILLS: SkillMeta[] = [
  {
    mdPath: 'plugins/vertical-plugins/private-equity/skills/deal-sourcing/SKILL.md',
    skillName: 'deal-sourcing',
    title: 'PE 项目寻找：发现目标公司 + 起草创始人开发信',
    intro: `<p>这是 Anthropic 官方的 PE <strong>项目 sourcing</strong> skill，覆盖从"找公司"到"发开发信"的完整三步流程：</p>
<ul>
<li><strong>第一步·发现公司</strong>：按行业、收入规模、地区、股权类型（创始人持有 / PE 背景 / 大公司剥离）筛选目标，输出带"为什么契合"的候选清单</li>
<li><strong>第二步·CRM 核查</strong>：发信前先查公司/创始人是否已在你的关系网里（邮件、Slack），标注"新接触 / 老关系 / 之前 pass 过"</li>
<li><strong>第三步·起草开发信</strong>：个性化、简短（4-6 句）、有具体钩子，绝不套模板</li>
</ul>
<blockquote>适合：每周要 sourcing 一批新公司的投资人。把这套流程交给 Claude，你只管 review 候选清单和信。</blockquote>`,
    scene: 'sourcing',
    contents: ['info-gather', 'automation'],
    assetType: 'agent-skill',
  },
  {
    mdPath: 'plugins/vertical-plugins/private-equity/skills/deal-screening/SKILL.md',
    skillName: 'deal-screening',
    title: '项目初筛：用投资标准快速判断要不要深看',
    intro: `<p>这是 Anthropic 官方的 PE <strong>项目初筛</strong> skill。收到一份 CIM / teaser 后，用你基金的投资标准做快速 pass/fail：</p>
<ul>
<li>抽取交易关键指标（规模、行业、财务、股权结构）</li>
<li>对照基金投资标准跑一遍打分框架</li>
<li>输出一页纸的初筛 memo：推荐 / 不推荐 + 理由</li>
</ul>
<blockquote>适合：deal flow 太多看不过来的投资人。先用 Claude 过一遍，把时间留给真正值得深看的项目。</blockquote>`,
    scene: 'screening',
    contents: ['memo', 'risk-id'],
    assetType: 'agent-skill',
  },
  {
    mdPath: 'plugins/vertical-plugins/private-equity/skills/dd-checklist/SKILL.md',
    skillName: 'dd-checklist',
    title: '尽调清单生成器：按行业和交易类型定制核查清单',
    intro: `<p>这是 Anthropic 官方的 PE <strong>尽调清单</strong> skill。开尽调时，按目标公司的行业、交易类型、复杂度，自动生成覆盖所有工作流的核查清单：</p>
<ul>
<li><strong>财务尽调</strong>：盈利质量、营运资金、债务类项目、资本开支、税务</li>
<li><strong>商业尽调</strong>：市场规模、竞争定位、客户集中度、定价权、销售管线</li>
<li><strong>法律尽调</strong>：公司架构、合同、IP、劳动法、监管</li>
<li>每项带请求清单 + 状态跟踪 + 红旗升级</li>
</ul>
<blockquote>适合：刚拿到一个项目要开尽调、或者组织 data room review 的团队。不再从零列清单。</blockquote>`,
    scene: 'business-dd',
    contents: ['checklist', 'doc-parse'],
    assetType: 'agent-skill',
  },
  {
    mdPath: 'plugins/vertical-plugins/private-equity/skills/unit-economics/SKILL.md',
    skillName: 'unit-economics',
    title: '单位经济模型：ARR cohort / LTV-CAC / 净留存分析',
    intro: `<p>这是 Anthropic 官方的 PE <strong>单位经济模型</strong> skill，专门分析 SaaS / 订阅类公司的收入质量：</p>
<ul>
<li><strong>ARR cohort 分析</strong>：按获客批次看留存和扩张</li>
<li><strong>LTV / CAC</strong>：客户生命周期价值 vs 获客成本</li>
<li><strong>净收入留存（NRR）</strong>：扩张 - 流失 - 降级</li>
<li><strong>回收期 + 收入质量 + 毛利瀑布</strong></li>
</ul>
<blockquote>适合：看软件 / SaaS 项目的投资人。单位经济是这类公司的命门，这套 skill 帮你把它拆透。</blockquote>`,
    scene: 'financial',
    industry: 'ai-saas',
    contents: ['data-clean', 'report-gen'],
    assetType: 'agent-skill',
  },
  {
    mdPath: 'plugins/vertical-plugins/private-equity/skills/ic-memo/SKILL.md',
    skillName: 'ic-memo',
    title: 'IC 投委会 memo：把尽调结论写成投资建议书',
    intro: `<p>这是 Anthropic 官方的 PE <strong>投委会 memo</strong> skill。把尽调发现、财务分析、交易条款综合成一份结构化的 IC 投资建议书：</p>
<ul>
<li>投资逻辑 / 商业模式 / 市场机会</li>
<li>财务亮点与风险</li>
<li>估值与交易结构</li>
<li>投资建议与条件</li>
</ul>
<blockquote>适合：要把一个项目推向 IC 决策的投资人。让 Claude 出 memo 初稿，你做判断和润色。</blockquote>`,
    scene: 'ic',
    contents: ['memo', 'report-gen'],
    assetType: 'agent-skill',
  },
];

async function ensureLibraryUser() {
  const existing = await prisma.user.findUnique({ where: { email: LIBRARY_USER.email } });
  if (existing) return existing;
  return prisma.user.create({
    data: {
      email: LIBRARY_USER.email,
      nickname: LIBRARY_USER.nickname,
      role: LIBRARY_USER.role,
      passwordHash: null, // 图书馆账号不可登录，只作为内容作者
    },
  });
}

async function importOne(meta: SkillMeta, userId: number, repoRoot: string) {
  const fullPath = path.join(repoRoot, meta.mdPath);

  // 幂等：按 sourceRepo + skillName 查是否已导入
  const slug = `anthropics-financial-services/${meta.skillName}`;
  const dup = await prisma.post.findFirst({
    where: { body: { contains: slug } },
  });
  if (dup) {
    console.log(`  ⏭️  ${meta.skillName} 已存在 (post #${dup.id})，跳过`);
    return;
  }

  // 读 SKILL.md
  const mdContent = await fs.readFile(fullPath, 'utf-8');

  // 上传为附件
  const buf = Buffer.from(mdContent, 'utf-8');
  const storageKey = await saveBuffer(buf, `${meta.skillName}.md`);
  const attachment = await prisma.attachment.create({
    data: {
      postId: null, // 先不绑，发帖后回填
      uploaderId: userId,
      fileName: `${meta.skillName}.md`,
      storageKey,
      fileSize: buf.length,
      mimeType: 'text/markdown',
    },
  });

  // 发帖：中文介绍 + 来源标注（含 slug 用于幂等）
  const body = meta.intro + SOURCE_NOTICE(meta.skillName) + `\n<!-- slug:${slug} -->`;

  const post = await prisma.post.create({
    data: {
      userId,
      title: meta.title,
      body,
      tagScene: meta.scene,
      tagIndustry: meta.industry ?? null,
      tagContent: JSON.stringify(meta.contents ?? []),
      tagSkill: meta.assetType,
      status: 'published',
      skillAsset: {
        create: {
          assetType: meta.assetType,
          sourceUrl: `https://github.com/anthropics/financial-services/blob/main/${meta.mdPath}`,
          installHint:
            '下载 SKILL.md 后，在 Claude Code 里放到 ~/.claude/skills/ 目录即可。命令：/' +
            meta.skillName,
        },
      },
    },
  });

  // 回填附件的 postId
  await prisma.attachment.update({
    where: { id: attachment.id },
    data: { postId: post.id },
  });

  console.log(`  ✅ ${meta.skillName} → post #${post.id} （${meta.title}）`);
}

async function main() {
  const repoRoot = process.argv[2] || '/tmp/fs-skills';
  console.log(`📚 导入开源 skill，repo: ${repoRoot}`);

  // 校验 repo 存在
  try {
    await fs.access(path.join(repoRoot, 'plugins'));
  } catch {
    console.error(`❌ 找不到 repo，先 clone：git clone --depth 1 https://github.com/anthropics/financial-services.git ${repoRoot}`);
    process.exit(1);
  }

  const user = await ensureLibraryUser();
  console.log(`👤 作者账号：${user.nickname} (#${user.id})`);

  let ok = 0;
  let skip = 0;
  for (const meta of SKILLS) {
    try {
      await importOne(meta, user.id, repoRoot);
      ok++;
    } catch (e) {
      console.error(`  ❌ ${meta.skillName} 导入失败:`, (e as Error).message);
    }
  }

  console.log(`\n🎉 完成：导入 ${ok} 个，跳过 ${skip} 个`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
