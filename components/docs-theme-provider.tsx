'use client';

import { usePathname } from 'next/navigation';
import type { CSSProperties, ReactNode } from 'react';
import { useTheme } from 'fumadocs-ui/provider/base';
import { getKnowledgeBaseThemeByRoot } from '@/config/knowledge-bases';

export function DocsThemeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const segments = pathname.split('/');
  const docsRoot = segments[2];
  const theme = getKnowledgeBaseThemeByRoot(docsRoot);
  const style = {
    '--kb-primary': theme.primary,
    '--kb-primary-foreground': '#ffffff',
    '--kb-accent': theme.accent,
    '--color-fd-primary': theme.primary,
    '--color-fd-primary-foreground': '#ffffff',
    '--color-fd-accent':
      resolvedTheme === 'dark'
        ? `color-mix(in oklab, ${theme.primary} 12%, transparent)`
        : theme.secondary,
    '--color-fd-accent-foreground':
      resolvedTheme === 'dark' ? 'var(--color-fd-foreground)' : theme.accent,
    '--color-fd-ring': theme.primary,
  } as CSSProperties;

  return <div style={style}>{children}</div>;
}
