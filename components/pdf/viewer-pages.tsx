import { createPageAnchorId } from "@/components/pdf/outline";
import type { PDFOutlineItem } from "@/components/pdf/outline";

type PDFViewerPagesProps = {
  pageCount: number;
  scopeId: string;
  outlineAnchorsByPage: ReadonlyMap<number, PDFOutlineItem[]>;
  registerCanvas: (pageNumber: number, node: HTMLCanvasElement | null) => void;
};

export function PDFViewerPages({
  pageCount,
  scopeId,
  outlineAnchorsByPage,
  registerCanvas,
}: PDFViewerPagesProps) {
  return (
    <div className="space-y-6 px-3 py-4 md:px-6 md:py-6">
      {Array.from({ length: pageCount }, (_, index) => {
        const pageNumber = index + 1;
        const outlineItems = outlineAnchorsByPage.get(pageNumber) ?? [];

        return (
          <section
            key={pageNumber}
            id={createPageAnchorId(scopeId, pageNumber)}
            data-pdf-page={pageNumber}
            className="scroll-mt-28"
          >
            {outlineItems.map((item) => (
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
                ref={(node) => registerCanvas(pageNumber, node)}
                className="max-w-full rounded-xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.12)]"
              />
            </div>
          </section>
        );
      })}
    </div>
  );
}
