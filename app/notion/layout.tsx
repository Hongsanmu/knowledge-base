import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { baseOptions } from "@/lib/layout.shared";
import { DocsThemeProvider } from "@/components/docs-theme-provider";
import { getNotionSite } from "@/lib/notion";

export default async function Layout({ children }: LayoutProps<"/notion">) {
  const site = await getNotionSite();

  return (
    <DocsThemeProvider>
      <DocsLayout
        tree={site.tree}
        tabs={false}
        sidebar={{ defaultOpenLevel: 1 }}
        {...baseOptions()}
      >
        {children}
      </DocsLayout>
    </DocsThemeProvider>
  );
}
