import Link from "next/link";
import { Card, Cards } from "fumadocs-ui/components/card";
import { KnowledgeBaseGrid } from "@/components/knowledge-base-grid";
import { getKnowledgeBaseCards } from "@/lib/knowledge-bases";
import { source } from "@/lib/source";

export default function HomePage() {
  const knowledgeBaseCards = getKnowledgeBaseCards();
  const pages = source.getPages().slice(0, 5);

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-fd-background">
      <section className="mx-auto flex min-h-[52vh] w-full max-w-6xl flex-col justify-center px-6 py-16 sm:px-8 lg:px-10">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-fd-primary">
            Atlas Knowledge Base
          </p>
          <h1 className="mt-5 text-4xl font-semibold tracking-normal text-zinc-950 sm:text-6xl">
            把知识库整理成清晰、统一、可持续维护的网站。
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600">
            每个知识库独立成组，进入后仍然使用 Fumadocs
            的文档页、左侧导航和搜索体验。
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/docs/team"
              className="inline-flex h-11 items-center justify-center rounded-md bg-fd-primary px-5 text-sm font-medium text-fd-primary-foreground shadow-sm transition hover:bg-fd-primary/80"
            >
              打开知识库
            </Link>
            <Link
              href="/docs/team/getting-started/content-model"
              className="inline-flex h-11 items-center justify-center rounded-md border bg-fd-card px-5 text-sm font-medium text-fd-card-foreground transition hover:bg-fd-accent"
            >
              查看内容模型
            </Link>
          </div>
        </div>
      </section>

      <KnowledgeBaseGrid items={knowledgeBaseCards} />

      <section className="mx-auto max-w-6xl px-6 py-12 sm:px-8 lg:px-10">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold text-zinc-950">最近文档</h2>
            <p className="mt-2 text-sm text-zinc-600">
              从这里进入常用页面，或在文档页按 Cmd/Ctrl + K 搜索。
            </p>
          </div>
          <Link
            href="/docs/team"
            className="text-sm font-medium text-fd-primary hover:text-fd-primary/80"
          >
            查看全部
          </Link>
        </div>
        <Cards className="mt-6 grid-cols-1">
          {pages.map((page) => (
            <Card
              key={page.url}
              href={page.url}
              title={page.data.title}
              description={page.data.description}
            />
          ))}
        </Cards>
      </section>
    </main>
  );
}
