export type KnowledgeBaseTheme = {
  primary: string;
  secondary: string;
  accent: string;
};

export type KnowledgeBaseThemeConfig = {
  slug: string;
  title: string;
  docsRoot: string;
  theme: KnowledgeBaseTheme;
};

export const defaultKnowledgeBaseTheme: KnowledgeBaseTheme = {
  primary: "#cc8b00",
  secondary: "#fff7df",
  accent: "#8a5d00",
};

export const knowledgeBaseThemes = [
  {
    slug: "docs",
    title: "团队知识库",
    docsRoot: "team",
    theme: defaultKnowledgeBaseTheme,
  },
  {
    slug: "rust",
    title: "Rust 知识库",
    docsRoot: "rust",
    theme: {
      primary: "#b45309",
      secondary: "#fff3e7",
      accent: "#7c2d12",
    },
  },
  {
    slug: "知乎",
    title: "知乎文章收藏",
    docsRoot: "zhihu",
    theme: defaultKnowledgeBaseTheme,
  },
  {
    slug: "日记",
    title: "个人日记",
    docsRoot: "diary",
    theme: defaultKnowledgeBaseTheme,
  },
] satisfies KnowledgeBaseThemeConfig[];

export function getKnowledgeBaseThemeByRoot(docsRoot: string | undefined) {
  return (
    knowledgeBaseThemes.find((base) => base.docsRoot === docsRoot)?.theme ??
    defaultKnowledgeBaseTheme
  );
}
