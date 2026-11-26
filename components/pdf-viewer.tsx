"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { TOCItemType } from "fumadocs-core/toc";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { usePDFTOC } from "@/components/pdf-toc-context";

type PDFViewerProps = {
  src: string;
  title?: string;
  className?: string;
  defaultScale?: number;
  minScale?: number;
  maxScale?: number;
};

type OutlineItem = {
  id: string;
  anchorId: string;
  level: number;
  pageNumber: number | null;
  title: string;
};

type PDFModule = typeof import("pdfjs-dist/legacy/build/pdf.mjs");

function normalizePdfSrc(src: string) {
  return src.startsWith("/") ? src : `/${src}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function pageAnchorId(pageNumber: number) {
  return `pdf-page-${pageNumber}`;
}

function outlineAnchorId(path: string, pageNumber: number) {
  return `pdf-outline-${path.replaceAll(".", "-")}-page-${pageNumber}`;
}

function sanitizeOutlineTitle(title: string) {
  return title.replace(/^0(?:\.\d+)+\.\s*/, "").trim();
}

async function resolveDestinationPage(
  pdf: any,
  dest: unknown,
): Promise<number | null> {
  let resolvedDest = dest;

  if (typeof resolvedDest === "string") {
    resolvedDest = await pdf.getDestination(resolvedDest);
  }

  if (!Array.isArray(resolvedDest) || !resolvedDest[0]) {
    return null;
  }

  const firstTarget = resolvedDest[0];

  if (typeof firstTarget === "object" && "num" in firstTarget) {
    const pageIndex = await pdf.getPageIndex(firstTarget);
    return pageIndex + 1;
  }

  if (typeof firstTarget === "number") {
    return firstTarget + 1;
  }

  return null;
}

async function buildOutlineItems(
  pdf: any,
  items: any[] | null,
  level = 0,
  prefix = "0",
): Promise<OutlineItem[]> {
  if (!items?.length) return [];

  const result: OutlineItem[] = [];

  for (const [index, item] of items.entries()) {
    const pageNumber = await resolveDestinationPage(pdf, item.dest);
    const path = `${prefix}.${index + 1}`;
    const title = sanitizeOutlineTitle(item.title || "未命名章节");

    result.push({
      id: `${path}-${item.title}`,
      anchorId: pageNumber
        ? outlineAnchorId(path, pageNumber)
        : `${path}-missing-page`,
      level,
      pageNumber,
      title,
    });

    if (item.items?.length) {
      result.push(...(await buildOutlineItems(pdf, item.items, level + 1, path)));
    }
  }

  return result;
}

function outlineToToc(items: OutlineItem[]): TOCItemType[] {
  return items
    .filter((item) => item.pageNumber)
    .map((item) => ({
      title: item.title,
      url: `#${item.anchorId}`,
      depth: Math.min(item.level + 2, 6),
    }));
}

function scrollToPage(pageNumber: number) {
  const element = document.getElementById(pageAnchorId(pageNumber));
  element?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function PDFViewer({
  src,
  title = "PDF 文档",
  className,
  defaultScale = 1,
  minScale = 0.8,
  maxScale = 1.8,
}: PDFViewerProps) {
  const normalizedSrc = useMemo(() => normalizePdfSrc(src), [src]);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const renderTasksRef = useRef<Map<number, any>>(new Map());
  const canvasesRef = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const pdfRef = useRef<any>(null);
  const [pdfModule, setPdfModule] = useState<PDFModule | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [scale, setScale] = useState(defaultScale);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [outlineItems, setOutlineItems] = useState<OutlineItem[]>([]);
  const pageInputId = useId();
  const { setToc, clearToc } = usePDFTOC();

  useEffect(() => {
    let disposed = false;

    async function loadPdfModule() {
      const module = await import("pdfjs-dist/legacy/build/pdf.mjs");
      const workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();

      module.GlobalWorkerOptions.workerSrc = workerSrc;

      if (!disposed) {
        setPdfModule(module);
      }
    }

    void loadPdfModule();

    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    const element = rootRef.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setContainerWidth(entry.contentRect.width);
    });

    observer.observe(element);
    setContainerWidth(element.clientWidth);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!pdfModule) return;
    const currentPdfModule = pdfModule;

    let cancelled = false;

    async function loadDocument() {
      setIsLoading(true);
      setError(null);
      setPageCount(0);
      setCurrentPage(1);
      setPageInput("1");
      setOutlineItems([]);
      setToc([]);

      renderTasksRef.current.forEach((task) => task?.cancel?.());
      renderTasksRef.current.clear();
      pdfRef.current?.destroy?.();
      pdfRef.current = null;

      try {
        const response = await fetch(normalizedSrc);
        if (!response.ok) {
          throw new Error(`无法加载 PDF 文件：${response.status}`);
        }

        const buffer = await response.arrayBuffer();

        const loadingTask = currentPdfModule.getDocument({
          data: new Uint8Array(buffer),
        });
        const pdf = await loadingTask.promise;

        if (cancelled) {
          await pdf.destroy();
          return;
        }

        pdfRef.current = pdf;
        setPageCount(pdf.numPages);

        const outline = await buildOutlineItems(pdf, await pdf.getOutline());
        if (!cancelled) {
          setOutlineItems(outline);
          setToc(outlineToToc(outline));
        }
      } catch (loadError) {
        if (!cancelled) {
          const message =
            loadError instanceof Error ? loadError.message : "PDF 加载失败";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadDocument();

    return () => {
      cancelled = true;
    };
  }, [normalizedSrc, pdfModule, setToc]);

  useEffect(() => {
    const pdf = pdfRef.current;

    if (!pdf || !containerWidth || isLoading || pageCount === 0) return;

    let cancelled = false;

    async function renderAllPages() {
      setIsRendering(true);
      setError(null);

      try {
        for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
          if (cancelled) return;

          const canvas = canvasesRef.current.get(pageNumber);
          if (!canvas) continue;

          const page = await pdf.getPage(pageNumber);
          const unscaledViewport = page.getViewport({ scale: 1 });
          const availableWidth = Math.max(containerWidth - 24, 280);
          const fitScale = availableWidth / unscaledViewport.width;
          const renderScale = fitScale * scale;
          const viewport = page.getViewport({ scale: renderScale });
          const outputScale = window.devicePixelRatio || 1;
          const context = canvas.getContext("2d");

          if (!context) continue;

          renderTasksRef.current.get(pageNumber)?.cancel?.();

          canvas.width = Math.floor(viewport.width * outputScale);
          canvas.height = Math.floor(viewport.height * outputScale);
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;

          context.setTransform(outputScale, 0, 0, outputScale, 0, 0);
          context.clearRect(0, 0, viewport.width, viewport.height);

          const renderTask = page.render({
            canvasContext: context,
            viewport,
          });

          renderTasksRef.current.set(pageNumber, renderTask);
          await renderTask.promise;
        }
      } catch (renderError) {
        if (
          !cancelled &&
          !(renderError instanceof Error &&
            renderError.name === "RenderingCancelledException")
        ) {
          const message =
            renderError instanceof Error
              ? renderError.message
              : "PDF 页面渲染失败";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setIsRendering(false);
        }
      }
    }

    void renderAllPages();

    return () => {
      cancelled = true;
      renderTasksRef.current.forEach((task) => task?.cancel?.());
      renderTasksRef.current.clear();
    };
  }, [containerWidth, isLoading, pageCount, scale]);

  useEffect(() => {
    if (pageCount === 0) return;

    const sections = Array.from({ length: pageCount }, (_, index) =>
      document.getElementById(pageAnchorId(index + 1)),
    ).filter((element): element is HTMLElement => Boolean(element));

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio);

        const target = visibleEntries[0]?.target;
        if (!target) return;

        const page = Number((target as HTMLElement).dataset.pdfPage);
        if (!Number.isNaN(page)) {
          setCurrentPage(page);
          setPageInput(String(page));
        }
      },
      {
        rootMargin: "-96px 0px -55% 0px",
        threshold: [0.2, 0.4, 0.6],
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      observer.disconnect();
    };
  }, [pageCount]);

  useEffect(() => {
    return () => {
      renderTasksRef.current.forEach((task) => task?.cancel?.());
      renderTasksRef.current.clear();
      pdfRef.current?.destroy?.();
      clearToc();
    };
  }, [clearToc]);

  function goToPage(pageNumber: number) {
    if (!pageCount) return;
    const nextPage = clamp(pageNumber, 1, pageCount);
    setCurrentPage(nextPage);
    setPageInput(String(nextPage));
    scrollToPage(nextPage);
  }

  function handlePageSubmit() {
    const parsed = Number(pageInput);
    if (!Number.isFinite(parsed)) {
      setPageInput(String(currentPage));
      return;
    }

    goToPage(parsed);
  }

  const outlineAnchorsByPage = useMemo(() => {
    const grouped = new Map<number, OutlineItem[]>();

    for (const item of outlineItems) {
      if (!item.pageNumber) continue;
      const existing = grouped.get(item.pageNumber) ?? [];
      existing.push(item);
      grouped.set(item.pageNumber, existing);
    }

    return grouped;
  }, [outlineItems]);

  return (
    <section
      ref={rootRef}
      className={cn("my-6 rounded-2xl border border-fd-border bg-fd-card/60", className)}
    >
      <div className="sticky top-(--fd-docs-row-2) z-10 border-b bg-fd-background/88 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <div className="me-auto min-w-0">
            <div className="truncate text-sm font-semibold text-fd-foreground">
              {title}
            </div>
            <div className="text-xs text-fd-muted-foreground">
              整本渲染，右侧目录已接管为 PDF 目录
            </div>
          </div>
          <button
            type="button"
            className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }))}
            onClick={() =>
              setScale((value) => clamp(Number((value - 0.1).toFixed(2)), minScale, maxScale))
            }
            aria-label="缩小"
          >
            <ZoomOut />
          </button>
          <span className="min-w-14 text-center text-sm font-medium text-fd-foreground">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }))}
            onClick={() =>
              setScale((value) => clamp(Number((value + 0.1).toFixed(2)), minScale, maxScale))
            }
            aria-label="放大"
          >
            <ZoomIn />
          </button>
          <button
            type="button"
            className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }))}
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1 || pageCount === 0}
            aria-label="上一页"
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }))}
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= pageCount || pageCount === 0}
            aria-label="下一页"
          >
            <ChevronRight />
          </button>
          <label
            htmlFor={pageInputId}
            className="text-sm text-fd-muted-foreground"
          >
            页码
          </label>
          <input
            id={pageInputId}
            inputMode="numeric"
            value={pageInput}
            onChange={(event) => setPageInput(event.target.value)}
            onBlur={handlePageSubmit}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handlePageSubmit();
              }
            }}
            className="w-20 rounded-md border bg-fd-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-fd-ring"
          />
          <span className="text-sm text-fd-muted-foreground">
            / {pageCount || "--"}
          </span>
          <a
            href={normalizedSrc}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
          >
            新窗口打开
          </a>
        </div>
      </div>

      {error ? (
        <div className="px-4 py-8">
          <div className="rounded-xl border border-dashed border-red-300 bg-red-50/70 p-6 text-sm text-red-700">
            <p className="font-medium">PDF 打开失败</p>
            <p className="mt-2">{error}</p>
          </div>
        </div>
      ) : null}

      {(isLoading || isRendering) && !error ? (
        <div className="inline-flex items-center gap-2 px-4 py-4 text-sm text-fd-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" />
          {isLoading ? "加载文档中" : "渲染整本 PDF 中"}
        </div>
      ) : null}

      <div className="space-y-6 px-3 py-4 md:px-6 md:py-6">
        {Array.from({ length: pageCount }, (_, index) => {
          const pageNumber = index + 1;

          return (
            <section
              key={pageNumber}
              id={pageAnchorId(pageNumber)}
              data-pdf-page={pageNumber}
              className="scroll-mt-28"
            >
              {(outlineAnchorsByPage.get(pageNumber) ?? []).map((item) => (
                <span
                  key={item.anchorId}
                  id={item.anchorId}
                  className="block scroll-mt-28"
                />
              ))}
              <div className="mb-2 text-center text-xs tracking-[0.2em] text-fd-muted-foreground uppercase">
                Page {pageNumber}
              </div>
              <div className="flex justify-center">
                <canvas
                  ref={(node) => {
                    if (node) {
                      canvasesRef.current.set(pageNumber, node);
                    } else {
                      canvasesRef.current.delete(pageNumber);
                    }
                  }}
                  className="max-w-full rounded-xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.12)]"
                />
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
