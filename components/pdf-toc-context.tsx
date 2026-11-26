"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { TOCItemType } from "fumadocs-core/toc";

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

  return (
    <PDFTOCContext.Provider value={value}>{children}</PDFTOCContext.Provider>
  );
}

export function usePDFTOC() {
  const context = useContext(PDFTOCContext);

  if (!context) {
    throw new Error("usePDFTOC must be used inside PDFTOCProvider");
  }

  return context;
}
