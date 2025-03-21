import '@testing-library/jest-dom';

// Mock ResizeObserver which is not available in JSDOM
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}; 