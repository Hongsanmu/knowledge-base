import type { Tokenizer } from "@orama/orama";

const searchSegments = /[\p{Script=Han}]+|[A-Za-zàèéìòóù0-9_'-]+/giu;
const hanSegment = /^\p{Script=Han}+$/u;

export function createSearchTokenizer(): Tokenizer {
  return {
    language: "zh-CN",
    normalizationCache: new Map(),
    tokenize(input) {
      const segments = input.match(searchSegments) ?? [];
      const tokens = segments.flatMap((segment) => {
        const normalized = segment
          .normalize("NFD")
          .replace(/\p{Diacritic}/gu, "")
          .toLowerCase();

        if (!hanSegment.test(segment)) return [normalized];

        const characters = Array.from(normalized);
        if (characters.length < 2) return characters;

        return characters
          .slice(0, -1)
          .map((character, index) => character + characters[index + 1]);
      });

      return Array.from(new Set(tokens));
    },
  };
}
