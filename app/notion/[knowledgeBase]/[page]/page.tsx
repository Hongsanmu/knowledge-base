import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { NotionPageRenderer } from "@/components/notion-renderer";
import {
  getNotionArticle,
  getNotionSite,
  getNotionSiteError,
  hasNotionConfig,
  notionPlaceholderKnowledgeBaseSlug,
  notionPlaceholderPageSlug,
} from "@/lib/notion";

export const dynamicParams = false;

export default async function NotionArticlePage(
  props: PageProps<"/notion/[knowledgeBase]/[page]">,
) {
  const params = await props.params;
  await getNotionSite();
  const siteError = getNotionSiteError();
  if (!hasNotionConfig()) {
    return (
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="rounded-2xl border border-fd-border bg-fd-card p-5 text-sm leading-7 text-fd-muted-foreground">
          当前还没有配置 `NOTION_PAGE_ID`，因此这里只渲染占位页面。配置完成后，三级页面会自动按
          `/notion/[知识库]/[页面]` 生成。
        </div>
      </main>
    );
  }
  if (siteError) {
    return (
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm leading-7 text-amber-900">
          {siteError}
        </div>
      </main>
    );
  }

  const article = await getNotionArticle(params.knowledgeBase, params.page);

  if (!article) notFound();

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="mb-8 space-y-3 border-b border-fd-border pb-6">
        <p className="text-sm font-semibold tracking-[0.18em] text-[var(--color-fd-primary)] uppercase">
          {article.knowledgeBase.title}
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-fd-foreground">
          {article.article.title}
        </h1>
        {article.article.description ? (
          <p className="max-w-2xl text-base leading-7 text-fd-muted-foreground">
            {article.article.description}
          </p>
        ) : null}
      </div>
      <NotionPageRenderer blocks={article.article.blocks} />
    </main>
  );
}

export async function generateStaticParams() {
  const site = await getNotionSite();
  const params = site.knowledgeBases.flatMap((knowledgeBase) =>
    knowledgeBase.articlePages.map((page) => ({
      knowledgeBase: knowledgeBase.slug,
      page: page.slug,
    })),
  );

  if (params.length === 0) {
    return [
      {
        knowledgeBase: notionPlaceholderKnowledgeBaseSlug,
        page: notionPlaceholderPageSlug,
      },
    ];
  }

  return params;
}

export async function generateMetadata(
  props: PageProps<"/notion/[knowledgeBase]/[page]">,
): Promise<Metadata> {
  const params = await props.params;
  await getNotionSite();
  const siteError = getNotionSiteError();
  if (
    !hasNotionConfig() ||
    (params.knowledgeBase === notionPlaceholderKnowledgeBaseSlug &&
      params.page === notionPlaceholderPageSlug)
  ) {
    return {
      title: "Notion Page",
      description: "等待配置 NOTION_PAGE_ID 以生成最终页面。",
    };
  }
  if (siteError) {
    return {
      title: "Notion Page",
      description: siteError,
    };
  }

  const article = await getNotionArticle(params.knowledgeBase, params.page);
  if (!article) notFound();

  return {
    title: article.article.title,
    description: article.article.description,
  };
}
