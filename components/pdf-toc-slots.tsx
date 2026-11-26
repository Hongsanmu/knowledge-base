"use client";

import { useMemo } from "react";
import type {
  TOCProviderProps,
} from "fumadocs-ui/components/toc";
import { useTOCItems } from "fumadocs-ui/components/toc";
import {
  TOC,
  TOCPopover,
  TOCProvider as DefaultTOCProvider,
  type TOCProps,
  type TOCPopoverProps,
} from "fumadocs-ui/layouts/docs/page/slots/toc";
import { usePDFTOC } from "@/components/pdf-toc-context";

export function PDFAwareTOCProvider(props: TOCProviderProps) {
  const { toc: pdfToc } = usePDFTOC();
  const resolvedToc = useMemo(
    () => (pdfToc.length > 0 ? pdfToc : props.toc),
    [pdfToc, props.toc],
  );

  return <DefaultTOCProvider {...props} toc={resolvedToc} />;
}

export function PDFAwareTOC(props: TOCProps) {
  const items = useTOCItems();

  if (items.length === 0) {
    return null;
  }

  return <TOC {...props} />;
}

export function PDFAwareTOCPopover(props: TOCPopoverProps) {
  const items = useTOCItems();

  if (items.length === 0) {
    return null;
  }

  return <TOCPopover {...props} />;
}
