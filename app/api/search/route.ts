import { source } from "@/lib/source";
import { createFromSource } from "fumadocs-core/search/server";

export const revalidate = false; // 静态缓存
export const { staticGET: GET } = createFromSource(source);
