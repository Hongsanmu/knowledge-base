'use client';

import { usePathname } from 'next/navigation';
import type { CSSProperties, ReactNode } from 'react';
import { getKnowledgeBaseThemeByRoot } from '@/lib/knowledge-base-themes';

export function DocsThemeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const segments = pathname.split('/');
  const docsRoot = segments[2];
  const theme = getKnowledgeBaseThemeByRoot(docsRoot);
  const style = {
    '--kb-primary': theme.primary,
    '--kb-primary-foreground': '#ffffff',
    '--kb-accent': theme.accent,
    '--color-fd-primary': theme.primary,
    '--color-fd-primary-foreground': '#ffffff',
    '--color-fd-accent': theme.secondary,
    '--color-fd-accent-foreground': theme.accent,
    '--color-fd-ring': theme.primary,
  } as CSSProperties;

  return <div style={style}>{children}</div>;
}
