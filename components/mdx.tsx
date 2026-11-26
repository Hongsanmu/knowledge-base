import { Bookmark } from '@/components/bookmark';
import { Callout } from 'fumadocs-ui/components/callout';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { Steps , Step} from 'fumadocs-ui/components/steps';
import * as Twoslash from 'fumadocs-twoslash/ui';
import { NetEaseMusic } from '@/components/net-ease-music';
import { PDFViewer } from '@/components/pdf-viewer';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    ...Twoslash,
    Bookmark,
    Callout,
    Steps,
    Step,
    NetEaseMusic,
    PDFViewer,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
