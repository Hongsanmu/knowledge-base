import { Client, isFullBlock, isFullDatabase, isFullPage } from "@notionhq/client";
import type {
  BlockObjectResponse,
  ChildDatabaseBlockObjectResponse,
  ListBlockChildrenResponse,
  PageObjectResponse,
  PartialBlockObjectResponse,
  QueryDataSourceResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints";
import type { Root } from "fumadocs-core/page-tree";

type NotionBlock = BlockObjectResponse;

export type NotionLeafPage = {
  id: string;
  title: string;
  slug: string;
  description: string;
  url: string;
};

export type NotionKnowledgeBase = {
  id: string;
  title: string;
  slug: string;
  description: string;
  url: string;
  contentBlocks: NotionBlock[];
  articlePages: NotionLeafPage[];
};

export type NotionArticle = {
  id: string;
  title: string;
  slug: string;
  description: string;
  url: string;
  blocks: NotionBlock[];
};

export type NotionSite = {
  rootPageId: string;
  knowledgeBases: NotionKnowledgeBase[];
  tree: Root;
};

export const notionPlaceholderKnowledgeBaseSlug = "__notion_placeholder__";
export const notionPlaceholderPageSlug = "__page_placeholder__";

const notionPageId = process.env.NOTION_PAGE_ID?.trim() ?? "";
let _client: Client | null = null;
let siteErrorMessage: string | undefined;

function client() {
  if (!_client) {
    _client = new Client({ auth: process.env.NOTION_TOKEN });
  }

  return _client;
}

const emptyTree: Root = {
  name: "Notion",
  children: [],
};

function invariantNotionPageId() {
  if (!notionPageId) {
    throw new Error("Missing NOTION_PAGE_ID environment variable.");
  }

  return notionPageId;
}

function richTextToPlainText(items: RichTextItemResponse[] = []) {
  return items.map((item) => item.plain_text).join("").trim();
}

function propertyToPlainText(page: PageObjectResponse, propertyName: string) {
  const property = page.properties[propertyName];
  if (!property) return "";

  switch (property.type) {
    case "title":
      return richTextToPlainText(property.title);
    case "rich_text":
      return richTextToPlainText(property.rich_text);
    case "select":
      return property.select?.name?.trim() ?? "";
    case "status":
      return property.status?.name?.trim() ?? "";
    case "url":
      return property.url?.trim() ?? "";
    case "email":
      return property.email?.trim() ?? "";
    case "phone_number":
      return property.phone_number?.trim() ?? "";
    case "number":
      return property.number != null ? String(property.number) : "";
    default:
      return "";
  }
}

function getPageTitle(page: PageObjectResponse) {
  for (const property of Object.values(page.properties)) {
    if (property.type === "title") {
      return richTextToPlainText(property.title) || "Untitled";
    }
  }

  return "Untitled";
}

function getPageSlug(page: PageObjectResponse) {
  const slug =
    propertyToPlainText(page, "slug") ||
    propertyToPlainText(page, "Slug");

  if (!slug) {
    throw new Error(`Notion page "${getPageTitle(page)}" is missing a slug property.`);
  }

  return slug;
}

function getPageDescription(page: PageObjectResponse) {
  return (
    propertyToPlainText(page, "description") ||
    propertyToPlainText(page, "Description") ||
    ""
  );
}

async function listAllBlockChildren(blockId: string) {
  const blocks: NotionBlock[] = [];
  let cursor: string | undefined;

  do {
    const response: ListBlockChildrenResponse = await client().blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
      page_size: 100,
    });

    blocks.push(
      ...response.results.filter((block): block is NotionBlock => isFullBlock(block)),
    );

    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);

  return blocks;
}

async function getChildPageDatabaseBlock(pageId: string) {
  const children = await listAllBlockChildren(pageId);
  const databases = children.filter(
    (block): block is ChildDatabaseBlockObjectResponse => block.type === "child_database",
  );

  if (databases.length !== 1) {
    throw new Error(
      `Expected page ${pageId} to contain exactly one child database block, received ${databases.length}.`,
    );
  }

  return {
    databaseBlock: databases[0],
    children,
  };
}

async function resolveSingleDataSourceId(databaseId: string) {
  const database = await client().databases.retrieve({ database_id: databaseId });
  if (!isFullDatabase(database)) {
    throw new Error(`Notion database ${databaseId} is not a full database object.`);
  }

  if (database.data_sources.length !== 1) {
    throw new Error(
      `Expected database ${databaseId} to contain exactly one data source, received ${database.data_sources.length}.`,
    );
  }

  return database.data_sources[0].id;
}

async function queryAllPagesFromDataSource(dataSourceId: string) {
  const pages: PageObjectResponse[] = [];
  let cursor: string | undefined;

  do {
    const response: QueryDataSourceResponse = await client().dataSources.query({
      data_source_id: dataSourceId,
      page_size: 100,
      start_cursor: cursor,
      result_type: "page",
    });

    pages.push(
      ...response.results.filter((result): result is PageObjectResponse => isFullPage(result)),
    );

    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);

  return pages;
}

function buildTree(knowledgeBases: NotionKnowledgeBase[]): Root {
  return {
    name: "Notion",
    children: knowledgeBases.map((base) => ({
      $id: `notion-folder-${base.slug}`,
      type: "folder" as const,
      name: base.title,
      description: base.description,
      defaultOpen: true,
      root: true,
      index: {
        $id: `notion-index-${base.slug}`,
        type: "page" as const,
        name: base.title,
        description: base.description,
        url: base.url,
      },
      children: base.articlePages.map((page) => ({
        $id: `notion-page-${base.slug}-${page.slug}`,
        type: "page" as const,
        name: page.title,
        description: page.description,
        url: page.url,
      })),
    })),
  };
}

async function retrievePage(pageId: string) {
  const page = await client().pages.retrieve({ page_id: pageId });
  if (!isFullPage(page)) {
    throw new Error(`Notion page ${pageId} is not a full page object.`);
  }

  return page;
}

async function loadKnowledgeBase(pageId: string): Promise<NotionKnowledgeBase> {
  const page = await retrievePage(pageId);
  const title = getPageTitle(page);
  const slug = getPageSlug(page);
  const description = getPageDescription(page);
  const { databaseBlock, children } = await getChildPageDatabaseBlock(pageId);
  const dataSourceId = await resolveSingleDataSourceId(databaseBlock.id);
  const articlePagesRaw = await queryAllPagesFromDataSource(dataSourceId);

  const articlePages = articlePagesRaw.map((article) => ({
    id: article.id,
    title: getPageTitle(article),
    slug: getPageSlug(article),
    description: getPageDescription(article),
    url: `/notion/${slug}/${getPageSlug(article)}`,
  }));

  const contentBlocks = children.filter((block) => block.id !== databaseBlock.id);

  return {
    id: page.id,
    title,
    slug,
    description,
    url: `/notion/${slug}`,
    contentBlocks,
    articlePages,
  };
}

async function loadArticle(knowledgeBase: NotionKnowledgeBase, articleId: string): Promise<NotionArticle> {
  const page = await retrievePage(articleId);
  const title = getPageTitle(page);
  const slug = getPageSlug(page);
  const description = getPageDescription(page);
  const blocks = await listAllBlockChildren(articleId);

  return {
    id: page.id,
    title,
    slug,
    description,
    url: `/notion/${knowledgeBase.slug}/${slug}`,
    blocks,
  };
}

let siteCache: Promise<NotionSite> | undefined;

function formatNotionError(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "无法从 Notion 读取内容，请检查 NOTION_TOKEN、NOTION_PAGE_ID，以及相关页面和数据库是否已共享给 integration。";
}

export async function getNotionSite(): Promise<NotionSite> {
  if (!siteCache) {
    siteCache = (async () => {
      if (!notionPageId) {
        siteErrorMessage = undefined;
        return {
          rootPageId: "",
          knowledgeBases: [],
          tree: emptyTree,
        };
      }

      try {
        const rootPageId = invariantNotionPageId();
        const { databaseBlock } = await getChildPageDatabaseBlock(rootPageId);
        const dataSourceId = await resolveSingleDataSourceId(databaseBlock.id);
        const knowledgeBasePages = await queryAllPagesFromDataSource(dataSourceId);
        const knowledgeBases = await Promise.all(
          knowledgeBasePages.map((page) => loadKnowledgeBase(page.id)),
        );

        siteErrorMessage = undefined;

        return {
          rootPageId,
          knowledgeBases,
          tree: buildTree(knowledgeBases),
        };
      } catch (error) {
        siteErrorMessage = formatNotionError(error);

        return {
          rootPageId: notionPageId,
          knowledgeBases: [],
          tree: emptyTree,
        };
      }
    })();
  }

  return siteCache;
}

export async function getNotionKnowledgeBase(slug: string) {
  const site = await getNotionSite();
  return site.knowledgeBases.find((base) => base.slug === slug);
}

export async function getNotionArticle(knowledgeBaseSlug: string, articleSlug: string) {
  const knowledgeBase = await getNotionKnowledgeBase(knowledgeBaseSlug);
  if (!knowledgeBase) return;

  const target = knowledgeBase.articlePages.find((page) => page.slug === articleSlug);
  if (!target) return;

  const article = await loadArticle(knowledgeBase, target.id);
  return {
    knowledgeBase,
    article,
  };
}

export function hasNotionConfig() {
  return Boolean(notionPageId && process.env.NOTION_TOKEN);
}

export function getNotionSiteError() {
  return siteErrorMessage;
}

export async function getNotionDebugInfo() {
  const info: {
    configured: boolean;
    rootPageId: string;
    tokenPresent: boolean;
    siteError?: string;
    rootDatabaseBlockId?: string;
    rootDataSourceId?: string;
    knowledgeBasePages?: Array<{
      id: string;
      title: string;
      slug?: string;
      description?: string;
    }>;
  } = {
    configured: hasNotionConfig(),
    rootPageId: notionPageId,
    tokenPresent: Boolean(process.env.NOTION_TOKEN),
    siteError: siteErrorMessage,
  };

  if (!hasNotionConfig()) {
    return info;
  }

  try {
    const rootPageId = invariantNotionPageId();
    const { databaseBlock } = await getChildPageDatabaseBlock(rootPageId);
    const dataSourceId = await resolveSingleDataSourceId(databaseBlock.id);
    const pages = await queryAllPagesFromDataSource(dataSourceId);

    info.rootDatabaseBlockId = databaseBlock.id;
    info.rootDataSourceId = dataSourceId;
    info.knowledgeBasePages = pages.map((page) => ({
      id: page.id,
      title: getPageTitle(page),
      slug:
        propertyToPlainText(page, "slug") ||
        propertyToPlainText(page, "Slug") ||
        undefined,
      description:
        propertyToPlainText(page, "description") ||
        propertyToPlainText(page, "Description") ||
        undefined,
    }));
  } catch (error) {
    info.siteError = formatNotionError(error);
  }

  return info;
}

export type { NotionBlock, PartialBlockObjectResponse };
