export type KnowledgeBaseTheme = {
  primary: string;
  secondary: string;
  accent: string;
};

export type KnowledgeBaseConfig = {
  slug: string;
  title: string;
  description: string;
  icon: "BookOpen" | "Code2" | "Database" | "Boxes" | "LibraryBig";
  docsRoot?: string;
  href: string;
  sort: number;
  theme: KnowledgeBaseTheme;
};

export const defaultKnowledgeBaseTheme: KnowledgeBaseTheme = {
  primary: "#cc8b00",
  secondary: "#fff7df",
  accent: "#8a5d00",
};

export const knowledgeBases = [
  {
    slug: "docs",
    title: "团队知识库",
    description:
      "把现有文档作为一个完整知识库，统一管理快速上手、运营流程、参考资料和摘录内容。",
    icon: "LibraryBig",
    docsRoot: "team",
    href: "/docs/team",
    sort: 10,
    theme: defaultKnowledgeBaseTheme,
  },
  {
    slug: "rust",
    title: "Rust 知识库",
    description: "围绕 Rust 生命周期、所有权和类型系统沉淀学习笔记。",
    icon: "Code2",
    docsRoot: "rust",
    href: "/docs/rust",
    sort: 20,
    theme: {
      primary: "#b45309",
      secondary: "#fff3e7",
      accent: "#7c2d12",
    },
  },
  {
    slug: "知乎",
    title: "知乎文章收藏",
    description: "汇总所有值得收藏的知乎文章，恋爱故事为主!",
    icon: "BookOpen",
    docsRoot: "zhihu",
    href: "/docs/zhihu",
    sort: 20,
    theme: defaultKnowledgeBaseTheme,
  },
  {
    slug: "日记",
    title: "个人日记",
    description: "平时生活的记录， 最重要的是我的二十二年",
    icon: "BookOpen",
    docsRoot: "diary",
    href: "/docs/diary",
    sort: 20,
    theme: defaultKnowledgeBaseTheme,
  },
] satisfies KnowledgeBaseConfig[];

export function getKnowledgeBaseThemeByRoot(docsRoot: string | undefined) {
  return (
    knowledgeBases.find((base) => base.docsRoot === docsRoot)?.theme ??
    defaultKnowledgeBaseTheme
  );
}
