'use client';

import { BookOpen, Boxes, Clock3, Code2, Database, LibraryBig } from 'lucide-react';
import { Card, Cards } from 'fumadocs-ui/components/card';
import type { KnowledgeBaseCardData } from '@/lib/knowledge-bases';

const iconMap = {
  BookOpen,
  Boxes,
  Clock3,
  Code2,
  Database,
  LibraryBig,
} as const;

export function KnowledgeBaseGrid({ items }: { items: KnowledgeBaseCardData[] }) {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-12 sm:px-8 lg:px-10">
      <div>
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-fd-primary">Knowledge Bases</p>
          <h2 className="mt-2 text-2xl font-semibold text-fd-foreground">全部知识库</h2>
        </div>
      </div>

      <Cards className="mt-6 grid-cols-1 md:grid-cols-2">
        {items.map((item) => (
          <KnowledgeBaseCard key={item.slug} item={item} />
        ))}
      </Cards>
    </section>
  );
}

function KnowledgeBaseCard({ item }: { item: KnowledgeBaseCardData }) {
  const Icon = iconMap[item.icon] ?? BookOpen;

  return (
    <Card
      href={item.href}
      icon={<Icon />}
      title={item.title}
      description={item.description}
      className="min-h-40"
    >
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-md border bg-fd-muted px-2 py-1 text-xs">
          <Clock3 className="size-3.5" />
          {item.updatedLabel}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-md border bg-fd-muted px-2 py-1 text-xs">
          <span className="size-2 rounded-full" style={{ backgroundColor: item.theme.primary }} />
          主题色
        </span>
      </div>
      <p className="mt-3 line-clamp-2">{item.preview}</p>
    </Card>
  );
}
