export const appName = "My App";
export const docsRoute = "/docs";
export const docsImageRoute = "/og/docs";

export const gitConfig = {
  user: "Hongsanmu",
  repo: "comment",
  branch: "main",
};

export const giscusConfig = {
  repo: `${gitConfig.user}/${gitConfig.repo}` as `${string}/${string}`,
  repoId: "R_kgDOScMbyA",
  category: "Q&A",
  categoryId: "DIC_kwDOScMbyM4C88fC",
  mapping: "pathname" as const,
  lang: "zh-CN",
};
