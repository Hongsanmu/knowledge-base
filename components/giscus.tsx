'use client';

import GiscusReact from '@giscus/react';
import { useTheme } from 'fumadocs-ui/provider/base';
import { siteConfig } from '@/config/site';

const giscusConfig = siteConfig.giscus;

export function Giscus({ term }: { term?: string }) {
  const { resolvedTheme } = useTheme();

  if (
    giscusConfig.repoId === 'YOUR_REPO_ID' ||
    giscusConfig.categoryId === 'YOUR_CATEGORY_ID'
  ) {
    return null;
  }

  return (
    <div className="mt-12 border-t pt-8" key={term}>
      <GiscusReact
        repo={giscusConfig.repo}
        repoId={giscusConfig.repoId}
        category={giscusConfig.category}
        categoryId={giscusConfig.categoryId}
        mapping={giscusConfig.mapping}
        term={term}
        strict="1"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="bottom"
        theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
        lang={giscusConfig.lang}
      />
    </div>
  );
}
