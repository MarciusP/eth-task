import "@testing-library/jest-dom";
import { jest } from "@jest/globals";

// Mock for window.URL.createObjectURL
if (typeof window.URL.createObjectURL === "undefined") {
  Object.defineProperty(window.URL, "createObjectURL", {
    value: jest.fn(),
    writable: true,
  });
}

// Mock for window.URL.revokeObjectURL
if (typeof window.URL.revokeObjectURL === "undefined") {
  Object.defineProperty(window.URL, "revokeObjectURL", {
    value: jest.fn(),
    writable: true,
  });
}

// Mock for Web Worker
if (typeof global.Worker === "undefined") {
  global.Worker = class Worker {
    constructor(stringUrl: string | URL) {}
    postMessage(
      message: any,
      options?: StructuredSerializeOptions | Transferable[]
    ): void {}
    terminate(): void {}
    onmessage: ((this: globalThis.Worker, ev: MessageEvent) => any) | null =
      null;
    onerror: ((this: globalThis.Worker, ev: ErrorEvent) => any) | null = null;
    onmessageerror:
      | ((this: globalThis.Worker, ev: MessageEvent) => any)
      | null = null;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions
    ): void {}
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | EventListenerOptions
    ): void {}
    dispatchEvent(event: Event): boolean {
      return false;
    }
  } as any;
}
