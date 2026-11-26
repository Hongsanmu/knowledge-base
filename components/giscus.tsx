'use client';

import GiscusReact from '@giscus/react';
import { giscusConfig } from '@/lib/shared';

export function Giscus({ term }: { term?: string }) {
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
        theme="light"
        lang={giscusConfig.lang}
      />
    </div>
  );
}
