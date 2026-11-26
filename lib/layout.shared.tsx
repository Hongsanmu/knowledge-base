import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { BookOpen } from "lucide-react";
import { siteConfig } from "@/config/site";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="inline-flex items-center gap-2">
          <BookOpen className="size-5 text-fd-primary" />
          <span>{siteConfig.name}</span>
        </span>
      ),
    },
    githubUrl: `https://github.com/${siteConfig.repository.owner}/${siteConfig.repository.name}`,
  };
}
