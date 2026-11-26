import Link from "next/link";
import { getNotionSite, getNotionSiteError, hasNotionConfig } from "@/lib/notion";

export default async function NotionHomePage() {
  const site = await getNotionSite();
  const configured = hasNotionConfig();
  const siteError = getNotionSiteError();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <div className="space-y-3">
        <p className="text-sm font-semibold tracking-[0.18em] text-[var(--color-fd-primary)] uppercase">
          Notion
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-fd-foreground">Notion 知识库</h1>
        <p className="max-w-2xl text-base leading-7 text-fd-muted-foreground">
          从指定的 Notion 主页面读取知识库目录。每个数据库页面对应一个知识库，每个知识库下的数据库条目对应最终内容页。
        </p>
      </div>
      {!configured ? (
        <div className="rounded-2xl border border-fd-border bg-fd-card p-5 text-sm leading-7 text-fd-muted-foreground">
          当前还没有配置 `NOTION_PAGE_ID`。配置环境变量后，`/notion` 会自动读取 Notion 主页面并生成知识库路由。
        </div>
      ) : null}
      {configured && siteError ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm leading-7 text-amber-900">
          {siteError}
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {site.knowledgeBases.map((base) => (
          <Link
            key={base.slug}
            href={base.url}
            className="rounded-2xl border border-fd-border bg-fd-card p-5 transition hover:border-[var(--color-fd-primary)] hover:shadow-sm"
          >
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-fd-foreground">{base.title}</h2>
              <p className="text-sm text-fd-muted-foreground">
                {base.description || "该知识库尚未填写 description。"}
              </p>
              <p className="text-sm font-medium text-[var(--color-fd-primary)]">
                {base.articlePages.length} 篇页面
              </p>
            </div>
          </Link>
        ))}
      </div>
      {configured && !siteError && site.knowledgeBases.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-fd-border p-5 text-sm text-fd-muted-foreground">
          已连接到 Notion，但当前主页面下没有解析出知识库页面，请确认主页面第一级内容只包含一个数据库，并且二级页面都设置了 `slug` 属性。
        </div>
      ) : null}
    </main>
  );
}
