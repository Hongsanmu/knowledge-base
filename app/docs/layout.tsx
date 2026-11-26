import { source } from "@/lib/source";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { baseOptions } from "@/lib/layout.shared";
import { DocsThemeProvider } from "@/components/docs-theme-provider";

export default function Layout({ children }: LayoutProps<"/docs">) {
  return (
    <DocsThemeProvider>
      <DocsLayout
        tree={source.getPageTree()}
        tabs={false}
        sidebar={{ defaultOpenLevel: 1 }}
        {...baseOptions()}
      >
        {children}
      </DocsLayout>
    </DocsThemeProvider>
  );
}
