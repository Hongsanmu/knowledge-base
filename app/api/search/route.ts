import { source } from "@/lib/source";
import { createFromSource } from "fumadocs-core/search/server";
import { createSearchTokenizer } from "@/lib/search-tokenizer";

export const revalidate = false; // 静态缓存
export const { staticGET: GET } = createFromSource(source, {
  tokenizer: createSearchTokenizer(),
});
