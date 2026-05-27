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
