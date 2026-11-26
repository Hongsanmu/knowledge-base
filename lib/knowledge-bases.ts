import { source } from "@/lib/source";
import { knowledgeBases } from "@/config/knowledge-bases";
import type { KnowledgeBaseConfig } from "@/config/knowledge-bases";

export type {
  KnowledgeBaseConfig,
  KnowledgeBaseTheme,
} from "@/config/knowledge-bases";

export type KnowledgeBaseCardData = KnowledgeBaseConfig & {
  documentCount: number;
  preview: string;
  updatedLabel: string;
};

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
