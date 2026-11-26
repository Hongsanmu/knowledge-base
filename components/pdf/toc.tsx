"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { TOCItemType } from "fumadocs-core/toc";
import type { TOCProviderProps } from "fumadocs-ui/components/toc";
import { useTOCItems } from "fumadocs-ui/components/toc";
import {
  TOC,
  TOCPopover,
  TOCProvider as DefaultTOCProvider,
  type TOCProps,
  type TOCPopoverProps,
} from "fumadocs-ui/layouts/docs/page/slots/toc";

type PDFTOCContextValue = {
  toc: TOCItemType[];
  setToc: (toc: TOCItemType[]) => void;
  clearToc: () => void;
};

const PDFTOCContext = createContext<PDFTOCContextValue | null>(null);

export function PDFTOCProvider({ children }: { children: ReactNode }) {
  const [toc, setToc] = useState<TOCItemType[]>([]);
  const updateToc = useCallback((nextToc: TOCItemType[]) => {
    setToc(nextToc);
  }, []);
  const clearToc = useCallback(() => {
    setToc([]);
  }, []);

  const value = useMemo<PDFTOCContextValue>(
    () => ({
      toc,
      setToc: updateToc,
      clearToc,
    }),
    [clearToc, toc, updateToc],
  );

  return <PDFTOCContext.Provider value={value}>{children}</PDFTOCContext.Provider>;
}

export function usePDFTOC() {
  return useContext(PDFTOCContext);
}

export function PDFAwareTOCProvider(props: TOCProviderProps) {
  const pdfToc = usePDFTOC()?.toc;
  const resolvedToc = useMemo(
    () => (pdfToc?.length ? pdfToc : props.toc),
    [pdfToc, props.toc],
  );

  return <DefaultTOCProvider {...props} toc={resolvedToc} />;
}

export function PDFAwareTOC(props: TOCProps) {
  const items = useTOCItems();

  if (items.length === 0) return null;

  return <TOC {...props} />;
}

export function PDFAwareTOCPopover(props: TOCPopoverProps) {
  const items = useTOCItems();

  if (items.length === 0) return null;

  return <TOCPopover {...props} />;
}
