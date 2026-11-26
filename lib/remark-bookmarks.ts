import type { Root } from "mdast";
import { visit } from "unist-util-visit";

function isExternalUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function remarkBookmarks() {
  return (tree: Root) => {
    visit(tree, "paragraph", (node, index, parent) => {
      if (!parent || typeof index !== "number") return;
      if (parent.type !== "root") return;
      if (node.children.length !== 1) return;

      const child = node.children[0];
      if (child.type !== "link" || !isExternalUrl(child.url)) return;

      parent.children[index] = {
        type: "mdxJsxFlowElement",
        name: "Bookmark",
        attributes: [
          {
            type: "mdxJsxAttribute",
            name: "href",
            value: child.url,
          },
        ],
        children: [],
      };
    });
  };
}
