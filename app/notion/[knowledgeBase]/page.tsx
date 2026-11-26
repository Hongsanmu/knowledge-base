import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { NotionPageRenderer } from "@/components/notion-renderer";
import {
  getNotionKnowledgeBase,
  getNotionSite,
  getNotionSiteError,
  hasNotionConfig,
  notionPlaceholderKnowledgeBaseSlug,
} from "@/lib/notion";

export const dynamicParams = false;

export default async function NotionKnowledgeBasePage(
  props: PageProps<"/notion/[knowledgeBase]">,
) {
  const params = await props.params;
  await getNotionSite();
  const siteError = getNotionSiteError();
  if (!hasNotionConfig()) {
    return (
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="rounded-2xl border border-fd-border bg-fd-card p-5 text-sm leading-7 text-fd-muted-foreground">
          当前还没有配置 `NOTION_PAGE_ID`，因此这里只渲染占位页面。配置完成后，真实的
          Notion 知识库会自动出现在 `/notion/...` 路由下。
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

  const knowledgeBase = await getNotionKnowledgeBase(params.knowledgeBase);

  if (!knowledgeBase) notFound();

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="mb-8 space-y-3 border-b border-fd-border pb-6">
        <p className="text-sm font-semibold tracking-[0.18em] text-[var(--color-fd-primary)] uppercase">
          Knowledge Base
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-fd-foreground">
          {knowledgeBase.title}
        </h1>
        {knowledgeBase.description ? (
          <p className="max-w-2xl text-base leading-7 text-fd-muted-foreground">
            {knowledgeBase.description}
          </p>
        ) : null}
      </div>
      <NotionPageRenderer
        blocks={knowledgeBase.contentBlocks}
      />
    </main>
  );
}

export async function generateStaticParams() {
  const site = await getNotionSite();
  if (site.knowledgeBases.length === 0) {
    return [{ knowledgeBase: notionPlaceholderKnowledgeBaseSlug }];
  }

  return site.knowledgeBases.map((knowledgeBase) => ({
    knowledgeBase: knowledgeBase.slug,
  }));
}

export async function generateMetadata(
  props: PageProps<"/notion/[knowledgeBase]">,
): Promise<Metadata> {
  const params = await props.params;
  await getNotionSite();
  const siteError = getNotionSiteError();
  if (!hasNotionConfig() || params.knowledgeBase === notionPlaceholderKnowledgeBaseSlug) {
    return {
      title: "Notion",
      description: "等待配置 NOTION_PAGE_ID 以生成知识库页面。",
    };
  }
  if (siteError) {
    return {
      title: "Notion",
      description: siteError,
    };
  }

  const knowledgeBase = await getNotionKnowledgeBase(params.knowledgeBase);
  if (!knowledgeBase) notFound();

  return {
    title: knowledgeBase.title,
    description: knowledgeBase.description,
  };
}
