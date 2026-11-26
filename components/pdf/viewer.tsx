"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import type {
  PDFDocumentLoadingTask,
  PDFDocumentProxy,
  PDFPageProxy,
  RenderTask,
} from "pdfjs-dist";
import { PDFViewerPages } from "@/components/pdf/viewer-pages";
import { PDFViewerToolbar } from "@/components/pdf/viewer-toolbar";
import {
  groupPDFOutlineByPage,
  loadPDFOutline,
  pdfOutlineToToc,
} from "@/components/pdf/outline";
import type { PDFOutlineItem } from "@/components/pdf/outline";
import { usePDFTOC } from "@/components/pdf/toc";
import { cn } from "@/lib/cn";

export type PDFViewerProps = {
  src: string;
  title?: string;
  className?: string;
  defaultScale?: number;
  minScale?: number;
  maxScale?: number;
};

type PDFModule = typeof import("pdfjs-dist/legacy/build/pdf.mjs");

function normalizePdfSrc(src: string) {
  return src.startsWith("/") ? src : `/${src}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function createViewerScopeId(id: string) {
  return `pdf-${id.replaceAll(":", "")}`;
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
  const rootRef = useRef<HTMLElement | null>(null);
  const renderTasksRef = useRef<Map<number, RenderTask>>(new Map());
  const canvasesRef = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const [pdfModule, setPdfModule] = useState<PDFModule | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [scale, setScale] = useState(defaultScale);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [outlineItems, setOutlineItems] = useState<PDFOutlineItem[]>([]);
  const id = useId();
  const scopeId = createViewerScopeId(id);
  const pageInputId = `${scopeId}-page-input`;
  const pdfToc = usePDFTOC();
  const setToc = pdfToc?.setToc;
  const clearToc = pdfToc?.clearToc;

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
      setToc?.([]);

      renderTasksRef.current.forEach((task) => task.cancel());
      renderTasksRef.current.clear();
      void pdfRef.current?.destroy();
      pdfRef.current = null;

      try {
        const response = await fetch(normalizedSrc);
        if (!response.ok) {
          throw new Error(`无法加载 PDF 文件：${response.status}`);
        }

        const buffer = await response.arrayBuffer();
        const loadingTask: PDFDocumentLoadingTask = currentPdfModule.getDocument({
          data: new Uint8Array(buffer),
        });
        const pdf = await loadingTask.promise;

        if (cancelled) {
          await pdf.destroy();
          return;
        }

        pdfRef.current = pdf;
        setPageCount(pdf.numPages);

        const outline = await loadPDFOutline(pdf, await pdf.getOutline(), scopeId);
        if (!cancelled) {
          setOutlineItems(outline);
          setToc?.(pdfOutlineToToc(outline));
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
  }, [normalizedSrc, pdfModule, scopeId, setToc]);

  useEffect(() => {
    if (!pdfRef.current || !containerWidth || isLoading || pageCount === 0) return;
    const pdf = pdfRef.current;

    let cancelled = false;

    async function renderAllPages() {
      setIsRendering(true);
      setError(null);

      try {
        for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
          if (cancelled) return;

          const canvas = canvasesRef.current.get(pageNumber);
          if (!canvas) continue;

          const page: PDFPageProxy = await pdf.getPage(pageNumber);
          const unscaledViewport = page.getViewport({ scale: 1 });
          const availableWidth = Math.max(containerWidth - 24, 280);
          const fitScale = availableWidth / unscaledViewport.width;
          const renderScale = fitScale * scale;
          const viewport = page.getViewport({ scale: renderScale });
          const outputScale = window.devicePixelRatio || 1;
          const context = canvas.getContext("2d");

          if (!context) continue;

          renderTasksRef.current.get(pageNumber)?.cancel();

          canvas.width = Math.floor(viewport.width * outputScale);
          canvas.height = Math.floor(viewport.height * outputScale);
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;

          context.setTransform(outputScale, 0, 0, outputScale, 0, 0);
          context.clearRect(0, 0, viewport.width, viewport.height);

          const renderTask: RenderTask = page.render({
            canvas: null,
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
      renderTasksRef.current.forEach((task) => task.cancel());
      renderTasksRef.current.clear();
    };
  }, [containerWidth, isLoading, pageCount, scale]);

  useEffect(() => {
    const sections = Array.from(
      rootRef.current?.querySelectorAll<HTMLElement>("[data-pdf-page]") ?? [],
    );

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
      renderTasksRef.current.forEach((task) => task.cancel());
      renderTasksRef.current.clear();
      void pdfRef.current?.destroy();
      clearToc?.();
    };
  }, [clearToc]);

  function goToPage(pageNumber: number) {
    if (!pageCount) return;
    const nextPage = clamp(pageNumber, 1, pageCount);
    setCurrentPage(nextPage);
    setPageInput(String(nextPage));
    rootRef.current
      ?.querySelector<HTMLElement>(`[data-pdf-page="${nextPage}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handlePageSubmit() {
    const parsed = Number(pageInput);
    if (!Number.isFinite(parsed)) {
      setPageInput(String(currentPage));
      return;
    }

    goToPage(parsed);
  }

  const outlineAnchorsByPage = useMemo(
    () => groupPDFOutlineByPage(outlineItems),
    [outlineItems],
  );
  const registerCanvas = useCallback(
    (pageNumber: number, node: HTMLCanvasElement | null) => {
      if (node) {
        canvasesRef.current.set(pageNumber, node);
      } else {
        canvasesRef.current.delete(pageNumber);
      }
    },
    [],
  );

  return (
    <section
      ref={rootRef}
      className={cn("my-6 rounded-2xl border border-fd-border bg-fd-card/60", className)}
    >
      <PDFViewerToolbar
        src={normalizedSrc}
        title={title}
        pageCount={pageCount}
        currentPage={currentPage}
        pageInput={pageInput}
        pageInputId={pageInputId}
        scale={scale}
        onZoomOut={() =>
          setScale((value) => clamp(Number((value - 0.1).toFixed(2)), minScale, maxScale))
        }
        onZoomIn={() =>
          setScale((value) => clamp(Number((value + 0.1).toFixed(2)), minScale, maxScale))
        }
        onPreviousPage={() => goToPage(currentPage - 1)}
        onNextPage={() => goToPage(currentPage + 1)}
        onPageInputChange={setPageInput}
        onPageSubmit={handlePageSubmit}
      />

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

      <PDFViewerPages
        pageCount={pageCount}
        scopeId={scopeId}
        outlineAnchorsByPage={outlineAnchorsByPage}
        registerCanvas={registerCanvas}
      />
    </section>
  );
}
