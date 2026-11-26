import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type PDFViewerToolbarProps = {
  src: string;
  title: string;
  pageCount: number;
  currentPage: number;
  pageInput: string;
  pageInputId: string;
  scale: number;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onPageInputChange: (value: string) => void;
  onPageSubmit: () => void;
};

export function PDFViewerToolbar({
  src,
  title,
  pageCount,
  currentPage,
  pageInput,
  pageInputId,
  scale,
  onZoomOut,
  onZoomIn,
  onPreviousPage,
  onNextPage,
  onPageInputChange,
  onPageSubmit,
}: PDFViewerToolbarProps) {
  return (
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
          onClick={onZoomOut}
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
          onClick={onZoomIn}
          aria-label="放大"
        >
          <ZoomIn />
        </button>
        <button
          type="button"
          className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }))}
          onClick={onPreviousPage}
          disabled={currentPage <= 1 || pageCount === 0}
          aria-label="上一页"
        >
          <ChevronLeft />
        </button>
        <button
          type="button"
          className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }))}
          onClick={onNextPage}
          disabled={currentPage >= pageCount || pageCount === 0}
          aria-label="下一页"
        >
          <ChevronRight />
        </button>
        <label htmlFor={pageInputId} className="text-sm text-fd-muted-foreground">
          页码
        </label>
        <input
          id={pageInputId}
          inputMode="numeric"
          value={pageInput}
          onChange={(event) => onPageInputChange(event.target.value)}
          onBlur={onPageSubmit}
          onKeyDown={(event) => {
            if (event.key === "Enter") onPageSubmit();
          }}
          className="w-20 rounded-md border bg-fd-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-fd-ring"
        />
        <span className="text-sm text-fd-muted-foreground">
          / {pageCount || "--"}
        </span>
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
        >
          新窗口打开
        </a>
      </div>
    </div>
  );
}
