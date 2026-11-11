"use client";

import dynamic from "next/dynamic";
import { DEMO_FRAME_CLASS, TASKBAR_CLASS, TASKBAR_HEIGHT, skyBackgroundClass, skyBackgroundStyle } from "./demoFrame";

/** Same size and sky as the demo, so nothing shifts when it arrives */
function DemoPlaceholder() {
  return (
    <div aria-hidden="true" className={`${DEMO_FRAME_CLASS} ${skyBackgroundClass}`} style={skyBackgroundStyle}>
      <div style={{ height: TASKBAR_HEIGHT }} className={TASKBAR_CLASS} />
    </div>
  );
}

/** The demo (engine, canvas, icons) loads in its own chunk on the client only */
export const LazyDemoDesktop = dynamic(() => import("./DemoDesktop").then((m) => m.DemoDesktop), {
  ssr: false,
  loading: DemoPlaceholder,
});
