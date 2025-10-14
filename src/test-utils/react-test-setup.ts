/**
 * React Test Setup
 * ----------------
 * Additional setup specifically for React component and hook testing
 * Extends the base setupTests.cjs with React-specific configurations
 */

import "@testing-library/jest-dom";
import { configure } from "@testing-library/react";

// Configure @testing-library/react
configure({
  // Increase timeout for async operations in React tests
  asyncUtilTimeout: 5000,

  // Better error messages for queries
  getElementError: (message, container) => {
    const error = new Error(
      `${message}\n\nDOM structure:\n${container.innerHTML}`
    );
    error.name = "TestingLibraryElementError";
    return error;
  },

  // Custom test ID attribute
  testIdAttribute: "data-testid",
});

// Polyfills for jsdom environment
if (typeof global.TextEncoder === "undefined") {
  const { TextEncoder, TextDecoder } = require("util");
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Mock IntersectionObserver for React components that use it
if (typeof global.IntersectionObserver === "undefined") {
  global.IntersectionObserver = class IntersectionObserver {
    constructor(callback) {
      this.callback = callback;
    }

    observe() {
      // Mock implementation
    }

    unobserve() {
      // Mock implementation
    }

    disconnect() {
      // Mock implementation
    }
  };
}

// Mock ResizeObserver for React components that use it
if (typeof global.ResizeObserver === "undefined") {
  global.ResizeObserver = class ResizeObserver {
    constructor(callback) {
      this.callback = callback;
    }

    observe() {
      // Mock implementation
    }

    unobserve() {
      // Mock implementation
    }

    disconnect() {
      // Mock implementation
    }
  };
}

// Mock matchMedia for responsive components
if (typeof global.matchMedia === "undefined") {
  global.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  });
}

// Mock window.scrollTo for components that use it
if (typeof global.scrollTo === "undefined") {
  global.scrollTo = () => {};
}

// Mock HTMLElement.scrollIntoView
if (
  typeof HTMLElement !== "undefined" &&
  typeof HTMLElement.prototype.scrollIntoView === "undefined"
) {
  HTMLElement.prototype.scrollIntoView = () => {};
}

// Enhanced console methods for React testing
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args[0];

  // Suppress known React testing warnings
  const suppressedWarnings = [
    "Warning: ReactDOM.render is deprecated",
    "Warning: componentWillReceiveProps has been renamed",
    "Warning: componentWillMount has been renamed",
    "Warning: componentWillUpdate has been renamed",
    "act(...) is not supported in production builds",
  ];

  if (
    typeof message === "string" &&
    suppressedWarnings.some((warning) => message.includes(warning))
  ) {
    return;
  }

  // Show React errors with better formatting
  if (typeof message === "string" && message.includes("React")) {
    originalConsoleError("🔴 React Test Error:", ...args);
  } else {
    originalConsoleError(...args);
  }
};

// React-specific cleanup
afterEach(() => {
  // Clean up any React-specific state
  if (global.activeIntervals) {
    global.activeIntervals.forEach((id) => clearInterval(id));
    global.activeIntervals.clear();
  }

  if (global.activeTimeouts) {
    global.activeTimeouts.forEach((id) => clearTimeout(id));
    global.activeTimeouts.clear();
  }
});

console.log("✅ React test setup completed");
