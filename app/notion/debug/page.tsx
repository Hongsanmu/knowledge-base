import { getNotionDebugInfo } from "@/lib/notion";

function Row({
  label,
  value,
}: {
  label: string;
  value: string | number | boolean | null | undefined;
}) {
  return (
    <div className="grid gap-2 border-b border-fd-border py-3 md:grid-cols-[220px_1fr]">
      <div className="text-sm font-medium text-fd-muted-foreground">{label}</div>
      <div className="break-all font-mono text-sm text-fd-foreground">
        {value === undefined || value === null || value === "" ? "N/A" : String(value)}
      </div>
    </div>
  );
}

export default async function NotionDebugPage() {
  const debug = await getNotionDebugInfo();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <div className="space-y-3">
        <p className="text-sm font-semibold tracking-[0.18em] text-[var(--color-fd-primary)] uppercase">
          Notion Debug
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-fd-foreground">
          Notion 调试面板
        </h1>
        <p className="max-w-3xl text-base leading-7 text-fd-muted-foreground">
          这个页面会显示当前服务端实际读到的 Notion 配置、根页面、一级数据库和解析出来的知识库列表，方便排查 404、权限和 slug 问题。
        </p>
      </div>

      <section className="rounded-2xl border border-fd-border bg-fd-card p-6">
        <h2 className="mb-4 text-xl font-semibold text-fd-foreground">配置状态</h2>
        <Row label="configured" value={debug.configured} />
        <Row label="tokenPresent" value={debug.tokenPresent} />
        <Row label="rootPageId" value={debug.rootPageId} />
        <Row label="rootDatabaseBlockId" value={debug.rootDatabaseBlockId} />
        <Row label="rootDataSourceId" value={debug.rootDataSourceId} />
        <Row label="siteError" value={debug.siteError} />
      </section>

      <section className="rounded-2xl border border-fd-border bg-fd-card p-6">
        <h2 className="mb-4 text-xl font-semibold text-fd-foreground">知识库解析结果</h2>
        {debug.knowledgeBasePages?.length ? (
          <div className="space-y-5">
            {debug.knowledgeBasePages.map((page) => (
              <div key={page.id} className="rounded-xl border border-fd-border p-4">
                <Row label="id" value={page.id} />
                <Row label="title" value={page.title} />
                <Row label="slug" value={page.slug} />
                <Row label="description" value={page.description} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-fd-muted-foreground">当前没有解析到任何知识库页面。</p>
        )}
      </section>
    </main>
  );
}
