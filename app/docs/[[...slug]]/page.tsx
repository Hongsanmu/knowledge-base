import { getPageImage, source } from "@/lib/source";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  ViewOptionsPopover,
} from "fumadocs-ui/layouts/docs/page";
import { notFound } from "next/navigation";
import { getMDXComponents } from "@/components/mdx";
import type { Metadata } from "next";
import { createRelativeLink } from "fumadocs-ui/mdx";
import { siteConfig } from "@/config/site";
import { Giscus } from "@/components/giscus";
import {
  PDFAwareTOC,
  PDFAwareTOCPopover,
  PDFAwareTOCProvider,
  PDFTOCProvider,
} from "@/components/pdf/toc";

export default async function Page(props: PageProps<"/docs/[[...slug]]">) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const mdxComponents = getMDXComponents({
    // this allows you to link to other pages with relative file paths
    a: createRelativeLink(source, page),
  });

  if (page.data.full) {
    return (
      <DocsPage
        full
        toc={[]}
        breadcrumb={{ enabled: false }}
        footer={{ enabled: false }}
        tableOfContent={{ enabled: false }}
        tableOfContentPopover={{ enabled: false }}
      >
        <MDX components={mdxComponents} />
      </DocsPage>
    );
  }

  return (
    <PDFTOCProvider>
      <DocsPage
        toc={page.data.toc}
        full={page.data.full}
        tableOfContent={{
          style: "clerk",
          enabled: true,
        }}
        tableOfContentPopover={{
          enabled: true,
        }}
        slots={{
          toc: {
            provider: PDFAwareTOCProvider,
            main: PDFAwareTOC,
            popover: PDFAwareTOCPopover,
          },
        }}
      >
        <DocsTitle>{page.data.title}</DocsTitle>
        <DocsDescription className="mb-0">
          {page.data.description}
        </DocsDescription>
        <div className="flex flex-row gap-2 items-center border-b pb-6">
          <ViewOptionsPopover
            githubUrl={`https://github.com/${siteConfig.repository.owner}/${siteConfig.repository.name}/blob/${siteConfig.repository.branch}/content/docs/${page.path}`}
          />
        </div>
        <DocsBody>
          <MDX components={mdxComponents} />
        </DocsBody>
        <Giscus term={page.url} />
      </DocsPage>
    </PDFTOCProvider>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(
  props: PageProps<"/docs/[[...slug]]">,
): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url,
    },
  };
}
