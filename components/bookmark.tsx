"use client";

import Microlink from "@microlink/react";

export function Bookmark({ href }: {
  href: string;
}) {
  return (
    <Microlink
      className="bookmark-card"
      url={href}
      size="normal"
      media={["screenshot", "image", "logo"]}
      lazy={false}
    />
  );
}
