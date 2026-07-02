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

/**
 * jsdom does not implement scrollIntoView/scrollTo, which CDK's virtual scroll
 * viewport and list navigation call directly.
 */
Element.prototype.scrollIntoView = vi.fn();
Element.prototype.scrollTo = vi.fn();