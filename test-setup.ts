import { vi } from 'vitest';

/**
 * Mocking ResizeObserver to prevent ReferenceErrors in jsdom
 */
class ResizeObserverMock {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock);