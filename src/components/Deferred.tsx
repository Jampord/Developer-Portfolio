"use client";

import dynamic from "next/dynamic";

// Loaded after the page is interactive, in their own JavaScript chunks
export const DeferredCursor = dynamic(() => import("./Cursor").then((m) => m.Cursor), { ssr: false });

export const DeferredCommandPalette = dynamic(() => import("./CommandPalette").then((m) => m.CommandPalette), {
  ssr: false,
});
