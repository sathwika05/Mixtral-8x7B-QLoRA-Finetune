import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Vitest runs without `globals`, so Testing Library's automatic per-test
// cleanup is not registered. Without this, one test's DOM leaks into the next.
afterEach(() => {
  cleanup();
});

// jsdom does not implement matchMedia, which Framer Motion's reduced-motion
// hook reads. Default to "no preference" so motion paths are exercised.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

// jsdom does not implement IntersectionObserver, which Framer Motion's
// viewport hooks require. The stub reports "not intersecting", so components
// render their static, non-animating path deterministically under test.
if (typeof globalThis.IntersectionObserver === "undefined") {
  class StubIntersectionObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = "";
    readonly thresholds: ReadonlyArray<number> = [];
    disconnect() {}
    observe() {}
    unobserve() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  globalThis.IntersectionObserver =
    StubIntersectionObserver as unknown as typeof IntersectionObserver;
}
