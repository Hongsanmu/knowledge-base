declare module "@microlink/react" {
  import type { ComponentType, CSSProperties } from "react";

  type MediaType = "iframe" | "video" | "audio" | "image" | "logo" | "screenshot";

  export type MicrolinkProps = {
    url: string;
    apiKey?: string;
    className?: string;
    fetchData?: boolean;
    lazy?: boolean | IntersectionObserverInit;
    media?: MediaType | MediaType[];
    size?: "small" | "normal" | "large";
    style?: CSSProperties;
  };

  const Microlink: ComponentType<MicrolinkProps>;

  export default Microlink;
}
