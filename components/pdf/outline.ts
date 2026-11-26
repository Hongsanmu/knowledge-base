import type { TOCItemType } from "fumadocs-core/toc";
import type { PDFDocumentProxy } from "pdfjs-dist";

type RefProxy = Parameters<PDFDocumentProxy["getPageIndex"]>[0];

type PDFOutlineNode = {
  title: string;
  dest: string | readonly unknown[] | null;
  items: PDFOutlineNode[];
};

type FlatPDFOutlineItem = {
  path: string;
  level: number;
  title: string;
  destination: string | readonly unknown[] | null;
};

type ResolvedPDFOutlineItem = Omit<FlatPDFOutlineItem, "destination"> & {
  pageNumber: number | null;
};

export type PDFOutlineItem = {
  anchorId: string;
  level: number;
  pageNumber: number | null;
  title: string;
};

export function createPageAnchorId(scopeId: string, pageNumber: number) {
  return `${scopeId}-page-${pageNumber}`;
}

export function createOutlineAnchorId(
  scopeId: string,
  path: string,
  pageNumber: number,
) {
  return `${scopeId}-outline-${path.replaceAll(".", "-")}-page-${pageNumber}`;
}

export function sanitizeOutlineTitle(title: string) {
  return title.replace(/^0(?:\.\d+)+\.\s*/, "").trim();
}

export function flattenPDFOutline(
  items: readonly PDFOutlineNode[] | null | undefined,
  level = 0,
  prefix = "0",
): FlatPDFOutlineItem[] {
  if (!items?.length) return [];

  return items.flatMap((item, index) => {
    const path = `${prefix}.${index + 1}`;
    const current: FlatPDFOutlineItem = {
      path,
      level,
      title: sanitizeOutlineTitle(item.title || "未命名章节"),
      destination: item.dest,
    };

    return [current, ...flattenPDFOutline(item.items, level + 1, path)];
  });
}

export function createPDFOutlineItems(
  items: readonly ResolvedPDFOutlineItem[],
  scopeId: string,
): PDFOutlineItem[] {
  return items.map((item) => ({
    anchorId: item.pageNumber
      ? createOutlineAnchorId(scopeId, item.path, item.pageNumber)
      : `${scopeId}-outline-${item.path.replaceAll(".", "-")}-missing-page`,
    level: item.level,
    pageNumber: item.pageNumber,
    title: item.title,
  }));
}

function isRefProxy(value: unknown): value is RefProxy {
  return (
    typeof value === "object" &&
    value !== null &&
    "num" in value &&
    typeof value.num === "number" &&
    "gen" in value &&
    typeof value.gen === "number"
  );
}

async function resolveDestinationPage(
  pdf: PDFDocumentProxy,
  destination: string | readonly unknown[] | null,
): Promise<number | null> {
  const resolvedDestination =
    typeof destination === "string"
      ? await pdf.getDestination(destination)
      : destination;

  if (!resolvedDestination?.length) return null;

  const firstTarget = resolvedDestination[0];

  if (isRefProxy(firstTarget)) {
    return (await pdf.getPageIndex(firstTarget)) + 1;
  }

  if (typeof firstTarget === "number" && Number.isInteger(firstTarget)) {
    return firstTarget + 1;
  }

  return null;
}

export async function loadPDFOutline(
  pdf: PDFDocumentProxy,
  items: readonly PDFOutlineNode[] | null | undefined,
  scopeId: string,
): Promise<PDFOutlineItem[]> {
  const flatItems = flattenPDFOutline(items);
  const resolvedItems: ResolvedPDFOutlineItem[] = [];

  for (const item of flatItems) {
    resolvedItems.push({
      path: item.path,
      level: item.level,
      title: item.title,
      pageNumber: await resolveDestinationPage(pdf, item.destination),
    });
  }

  return createPDFOutlineItems(resolvedItems, scopeId);
}

export function pdfOutlineToToc(items: readonly PDFOutlineItem[]): TOCItemType[] {
  return items
    .filter((item) => item.pageNumber !== null)
    .map((item) => ({
      title: item.title,
      url: `#${item.anchorId}`,
      depth: Math.min(item.level + 2, 6),
    }));
}

export function groupPDFOutlineByPage(
  items: readonly PDFOutlineItem[],
): Map<number, PDFOutlineItem[]> {
  const grouped = new Map<number, PDFOutlineItem[]>();

  for (const item of items) {
    if (item.pageNumber === null) continue;

    const existing = grouped.get(item.pageNumber) ?? [];
    existing.push(item);
    grouped.set(item.pageNumber, existing);
  }

  return grouped;
}
