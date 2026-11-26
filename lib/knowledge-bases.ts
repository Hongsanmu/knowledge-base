import { source } from "@/lib/source";
import {
  knowledgeBaseThemes,
  type KnowledgeBaseTheme,
} from "@/lib/knowledge-base-themes";

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

export type KnowledgeBaseCardData = KnowledgeBaseConfig & {
  documentCount: number;
  preview: string;
  updatedLabel: string;
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
    theme: knowledgeBaseThemes[0].theme,
  },
  {
    slug: "rust",
    title: "Rust 知识库",
    description: "围绕 Rust 生命周期、所有权和类型系统沉淀学习笔记。",
    icon: "Code2",
    docsRoot: "rust",
    href: "/docs/rust",
    sort: 20,
    theme: knowledgeBaseThemes[1].theme,
  },
  {
    slug: "知乎",
    title: "知乎文章收藏",
    description: "汇总所有值得收藏的知乎文章，恋爱故事为主!",
    icon: "BookOpen",
    docsRoot: "zhihu",
    href: "/docs/zhihu",
    sort: 20,
    theme: knowledgeBaseThemes[2].theme,
  },
  {
    slug: "日记",
    title: "个人日记",
    description: "平时生活的记录， 最重要的是我的二十二年",
    icon: "BookOpen",
    docsRoot: "diary",
    href: "/docs/diary",
    sort: 20,
    theme: knowledgeBaseThemes[3].theme,
  },
] satisfies KnowledgeBaseConfig[];

export function getKnowledgeBase(slug: string) {
  return knowledgeBases.find((base) => base.slug === slug);
}

export function getKnowledgeBaseForSlugs(slugs: string[]) {
  const docsRoot = slugs[0];
  const matchedBase = knowledgeBases.find((base) => base.docsRoot === docsRoot);

  return matchedBase ?? knowledgeBases[0];
}

export function getKnowledgeBasePages(base: KnowledgeBaseConfig) {
  return source
    .getPages()
    .filter((page) => {
      return page.slugs[0] === base.docsRoot;
    })
    .sort((a, b) => {
      const depth = a.slugs.length - b.slugs.length;
      if (depth !== 0) return depth;

      return a.data.title.localeCompare(b.data.title, "zh-CN");
    });
}

export function getKnowledgeBaseCards(): KnowledgeBaseCardData[] {
  return knowledgeBases
    .map((base) => {
      const pages = getKnowledgeBasePages(base);
      const preview =
        pages
          .map((page) => page.data.description)
          .filter(Boolean)
          .slice(0, 2)
          .join(" / ") || base.description;

      return {
        ...base,
        documentCount: pages.length,
        preview,
        updatedLabel: pages.length > 0 ? `${pages.length} 篇文档` : "等待内容",
      };
    })
    .sort((a, b) => a.sort - b.sort);
}
