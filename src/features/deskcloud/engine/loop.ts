export type Loop = {
  start(): void;
  stop(): void;
  readonly running: boolean;
};

type LoopOptions = {
  /** Frames per second to step and render at */
  fps?: number;
  /** Longest dt passed to onFrame, in seconds, so a stalled tab doesn't cause a jump */
  maxDt?: number;
};

/**
 * requestAnimationFrame loop capped at `fps`. rAF ticks between frames return
 * straight away, and stop() cancels the next tick so a paused loop does no work.
 */
export function createLoop(onFrame: (dt: number) => void, { fps = 30, maxDt = 0.1 }: LoopOptions = {}): Loop {
  const interval = 1000 / fps;
  let raf = 0;
  let last = 0;
  let running = false;

  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    const elapsed = now - last;
    // 1 ms of slack so a 60 Hz display (ticks every ~16.7 ms) lands on every second tick
    if (elapsed < interval - 1) return;
    last = now;
    onFrame(Math.min(elapsed, maxDt * 1000) / 1000);
  };

  return {
    start() {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    },
    stop() {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
    },
    get running() {
      return running;
    },
  };
}
