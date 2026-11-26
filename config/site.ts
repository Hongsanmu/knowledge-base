type GiscusConfig = {
  repo: `${string}/${string}`;
  repoId: string;
  category: string;
  categoryId: string;
  mapping: "pathname";
  lang: string;
};

const giscusConfig: GiscusConfig = {
  repo: "Hongsanmu/comment",
  repoId: "R_kgDOScMbyA",
  category: "Q&A",
  categoryId: "DIC_kwDOScMbyM4C88fC",
  mapping: "pathname",
  lang: "zh-CN",
};

export const siteConfig = {
  name: "Atlas Knowledge Base",
  titleTemplate: "%s | Atlas Knowledge Base",
  description: "把团队知识整理成清晰、可搜索、可持续维护的网站",
  docs: {
    route: "/docs",
    imageRoute: "/og/docs",
  },
  repository: {
    owner: "Hongsanmu",
    name: "knowledge-base",
    branch: "main",
  },
  giscus: giscusConfig,
} as const;
