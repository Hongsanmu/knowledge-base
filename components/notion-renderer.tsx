import type {
  BlockObjectResponse,
  BulletedListItemBlockObjectResponse,
  NumberedListItemBlockObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints";
import type { NotionBlock } from "@/lib/notion";

function isSafeHref(href: string) {
  try {
    const url = new URL(href);
    return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function RichText({ items }: { items: RichTextItemResponse[] }) {
  return (
    <>
      {items.map((item, index) => {
        const content = item.plain_text;
        const classes = [
          item.annotations.bold ? "font-semibold" : "",
          item.annotations.italic ? "italic" : "",
          item.annotations.strikethrough ? "line-through" : "",
          item.annotations.code ? "rounded bg-fd-muted px-1.5 py-0.5 font-mono text-[0.9em]" : "",
        ]
          .filter(Boolean)
          .join(" ");

        if (item.type === "text" && item.href && isSafeHref(item.href)) {
          return (
            <a
              key={`${content}-${index}`}
              href={item.href}
              className={classes || "text-[var(--color-fd-primary)] underline underline-offset-4"}
              target="_blank"
              rel="noreferrer"
            >
              {content}
            </a>
          );
        }

        return (
          <span key={`${content}-${index}`} className={classes || undefined}>
            {content}
          </span>
        );
      })}
    </>
  );
}

function Paragraph({ block }: { block: BlockObjectResponse }) {
  switch (block.type) {
    case "paragraph":
      return block.paragraph.rich_text.length ? (
        <p className="text-base leading-8 text-fd-foreground">
          <RichText items={block.paragraph.rich_text} />
        </p>
      ) : null;
    case "heading_1":
      return (
        <h2 className="mt-10 text-3xl font-bold tracking-tight text-fd-foreground">
          <RichText items={block.heading_1.rich_text} />
        </h2>
      );
    case "heading_2":
      return (
        <h3 className="mt-8 text-2xl font-semibold tracking-tight text-fd-foreground">
          <RichText items={block.heading_2.rich_text} />
        </h3>
      );
    case "heading_3":
      return (
        <h4 className="mt-6 text-xl font-semibold tracking-tight text-fd-foreground">
          <RichText items={block.heading_3.rich_text} />
        </h4>
      );
    case "bulleted_list_item":
      return (
        <li className="ml-5 list-disc text-base leading-8 text-fd-foreground">
          <RichText items={block.bulleted_list_item.rich_text} />
        </li>
      );
    case "numbered_list_item":
      return (
        <li className="ml-5 list-decimal text-base leading-8 text-fd-foreground">
          <RichText items={block.numbered_list_item.rich_text} />
        </li>
      );
    case "quote":
      return (
        <blockquote className="border-l-4 border-[var(--color-fd-primary)] pl-4 text-base leading-8 text-fd-muted-foreground">
          <RichText items={block.quote.rich_text} />
        </blockquote>
      );
    case "to_do":
      return (
        <label className="flex items-start gap-3 text-base leading-8 text-fd-foreground">
          <input type="checkbox" checked={block.to_do.checked} readOnly className="mt-2" />
          <span>
            <RichText items={block.to_do.rich_text} />
          </span>
        </label>
      );
    case "toggle":
      return (
        <details className="rounded-xl border border-fd-border bg-fd-card/60 p-4">
          <summary className="cursor-pointer text-base font-medium text-fd-foreground">
            <RichText items={block.toggle.rich_text} />
          </summary>
        </details>
      );
    case "code":
      return (
        <pre className="overflow-x-auto rounded-2xl border border-fd-border bg-zinc-950/96 p-4 text-sm text-zinc-100">
          <code>
            <RichText items={block.code.rich_text} />
          </code>
        </pre>
      );
    case "divider":
      return <hr className="my-8 border-fd-border" />;
    case "callout":
      return (
        <div className="rounded-2xl border border-fd-border bg-fd-card p-4 text-base leading-8 text-fd-foreground">
          <RichText items={block.callout.rich_text} />
        </div>
      );
    case "bookmark":
      return (
        isSafeHref(block.bookmark.url) ? (
          <a
            href={block.bookmark.url}
            target="_blank"
            rel="noreferrer"
            className="block rounded-2xl border border-fd-border bg-fd-card p-4 text-[var(--color-fd-primary)] hover:underline"
          >
            {block.bookmark.caption.length ? (
              <RichText items={block.bookmark.caption} />
            ) : (
              block.bookmark.url
            )}
          </a>
        ) : (
          <p className="rounded-2xl border border-fd-border bg-fd-card p-4 text-base leading-8 text-fd-foreground">
            {block.bookmark.caption.length ? (
              <RichText items={block.bookmark.caption} />
            ) : (
              block.bookmark.url
            )}
          </p>
        )
      );
    case "child_page":
      return <span>{block.child_page.title}</span>;
    default:
      return null;
  }
}

function ListGroup({
  items,
  type,
}: {
  items: Array<BulletedListItemBlockObjectResponse | NumberedListItemBlockObjectResponse>;
  type: "bulleted_list_item" | "numbered_list_item";
}) {
  const Tag = type === "bulleted_list_item" ? "ul" : "ol";

  return (
    <Tag className="space-y-2">
      {items.map((block) => (
        <Paragraph key={block.id} block={block} />
      ))}
    </Tag>
  );
}

export function NotionPageRenderer({ blocks }: { blocks: NotionBlock[] }) {
  const content: React.ReactNode[] = [];

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];

    if (block.type === "bulleted_list_item" || block.type === "numbered_list_item") {
      const listType = block.type;
      const listItems = [block];
      let nextIndex = index + 1;

      while (nextIndex < blocks.length && blocks[nextIndex].type === listType) {
        listItems.push(
          blocks[nextIndex] as
            | BulletedListItemBlockObjectResponse
            | NumberedListItemBlockObjectResponse,
        );
        nextIndex += 1;
      }

      content.push(<ListGroup key={`${listType}-${block.id}`} items={listItems} type={listType} />);
      index = nextIndex - 1;
      continue;
    }

    const rendered = <Paragraph key={block.id} block={block} />;
    if (rendered) content.push(rendered);
  }

  return <div className="notion-shell space-y-5">{content}</div>;
}
