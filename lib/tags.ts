// PEVC 原生四维分类体系（PRD §4）

export const SCENE_TAGS = [
  { value: 'sourcing', label: 'Sourcing / 项目发现', desc: '项目线索获取、行业扫描、创始人 Mapping' },
  { value: 'screening', label: '初筛与项目判断', desc: '快速判断项目质量的方法论、框架、评分模型' },
  { value: 'industry-research', label: '行业研究', desc: '行业深度报告、赛道分析、市场规模测算' },
  { value: 'business-dd', label: '商业尽调', desc: '业务、产品、团队、市场的尽调方法与案例' },
  { value: 'financial', label: '财务分析', desc: '财务模型、估值方法、财务健康度评估' },
  { value: 'legal', label: '法务 / 合规协作', desc: '投资协议要点、VIE 结构、合规风险提示' },
  { value: 'ic', label: 'IC 材料', desc: '投委会材料撰写、模板、立项报告范例' },
  { value: 'post-investment', label: '投后管理', desc: '投后赋能、董事会参与、增值服务案例' },
  { value: 'fundraising', label: '募资与 LP 沟通', desc: 'LP 关系维护、募资策略、LP 材料撰写' },
  { value: 'crm', label: 'CRM / 知识库 / 会议纪要', desc: '团队知识管理工具、CRM 使用技巧、会议纪要模板' },
] as const;

export const INDUSTRY_TAGS = [
  { value: 'ai-saas', label: 'AI / SaaS / Enterprise' },
  { value: 'biotech', label: 'BioTech / MedTech' },
  { value: 'consumer', label: 'Consumer / Brand' },
  { value: 'robotics', label: 'Robotics / Advanced Manufacturing' },
  { value: 'climate', label: 'Climate / Energy' },
  { value: 'fintech', label: 'FinTech' },
  { value: 'crypto', label: 'Crypto / Web3' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'cross-border', label: 'Cross-border / Globalization' },
] as const;

export const CONTENT_TAGS = [
  { value: 'info-gather', label: '信息搜集' },
  { value: 'doc-parse', label: '文档解析' },
  { value: 'data-clean', label: '数据清洗' },
  { value: 'report-gen', label: '报告生成' },
  { value: 'debate', label: '观点辩论' },
  { value: 'memo', label: '投资 Memo' },
  { value: 'expert-call', label: '专家访谈准备' },
  { value: 'company-profile', label: '公司画像' },
  { value: 'competitive-map', label: '竞品地图' },
  { value: 'risk-id', label: '风险识别' },
  { value: 'automation', label: '自动化流程' },
] as const;

export const SKILL_TAGS = [
  { value: 'prompt', label: 'Prompt', desc: '可直接使用的 AI 提示词' },
  { value: 'agent-skill', label: 'Agent Skill / SKILL.md', desc: '结构化的 AI Agent 指令文件' },
  { value: 'workflow', label: 'Workflow', desc: '可复现的工作流描述' },
  { value: 'tool-stack', label: 'Tool Stack', desc: '工具组合推荐与使用场景' },
  { value: 'template', label: 'Template', desc: '可复用的文档模板' },
  { value: 'api-script', label: 'API / Script', desc: '可执行代码片段' },
  { value: 'case-study', label: 'Case Study', desc: '完整方法论应用案例' },
] as const;

export const ROLE_TAGS = [
  { value: 'VC', label: 'VC', desc: '风险投资机构从业者' },
  { value: 'PE', label: 'PE', desc: '私募股权机构从业者' },
  { value: 'FA', label: 'FA', desc: '财务顾问 / 中介机构从业者' },
] as const;

export type Role = (typeof ROLE_TAGS)[number]['value'];

const lookup = <T extends { value: string; label: string }>(arr: readonly T[], v?: string | null) =>
  v ? arr.find((x) => x.value === v)?.label ?? v : '';

export const sceneLabel = (v?: string | null) => lookup(SCENE_TAGS, v);
export const industryLabel = (v?: string | null) => lookup(INDUSTRY_TAGS, v);
export const contentLabel = (v?: string | null) => lookup(CONTENT_TAGS, v);
export const skillLabel = (v?: string | null) => lookup(SKILL_TAGS, v);

export const roleColor = (role: string) => {
  switch (role) {
    case 'VC':
      return 'bg-emerald-50 text-emerald-700';
    case 'PE':
      return 'bg-violet-50 text-violet-700';
    case 'FA':
      return 'bg-amber-50 text-amber-700';
    default:
      return 'bg-ink-100 text-ink-700';
  }
};

export const ASSET_TYPE_HELPERS: Record<string, { body: string; installHint: string; usageNotes: string }> = {
  prompt: {
    body: '建议包含：Prompt 原文、输入示例、期望输出格式、适用场景说明。',
    installHint: '说明使用这个 Prompt 需要的模型或工具（如 ChatGPT、Claude 等）。',
    usageNotes: '说明这个 Prompt 适合谁使用、在什么场景下使用效果最好。',
  },
  'agent-skill': {
    body: '建议包含：SKILL.md 全文或核心结构、安装步骤、使用方法。',
    installHint: '提供 SKILL.md 的安装方式（如放置路径、Claude Code 命令等）。',
    usageNotes: '说明这个 Agent Skill 的适用场景、注意事项和已知限制。',
  },
  workflow: {
    body: '建议包含：完整工作流步骤、每步输入/输出、可复现的操作说明。',
    installHint: '说明工作流中需要的工具、环境和前置条件。',
    usageNotes: '说明这个 Workflow 适合的场景、预期产出和常见问题。',
  },
  'tool-stack': {
    body: '建议包含：工具组合清单、每个工具的作用、组合使用的步骤。',
    installHint: '列出所有工具的安装或注册方式。',
    usageNotes: '说明这个工具组合适合谁、核心优势和替代方案。',
  },
  template: {
    body: '建议包含：模板用途说明、使用步骤、填写要点。模板文件请作为附件上传。',
    installHint: '说明模板格式（Word / Excel / PPT / Markdown 等）和打开方式。',
    usageNotes: '说明模板适合的场景和自定义建议。',
  },
  'api-script': {
    body: '建议包含：脚本用途、完整代码或核心逻辑、运行方式。',
    installHint: '说明运行环境、依赖安装（如 pip install / npm install）和环境变量配置。',
    usageNotes: '说明脚本的使用场景、输入输出格式和注意事项。',
  },
  'case-study': {
    body: '建议包含：项目背景、方法论、完整步骤、结果和复盘总结。',
    installHint: '说明复现这个案例需要的工具和数据。',
    usageNotes: '说明这个案例的适用范围和可借鉴的要点。',
  },
};
