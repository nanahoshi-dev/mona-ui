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
window.scrollTo = vi.fn();
window.scrollBy = vi.fn();

/**
 * jsdom has no native canvas backend (it would need the optional `canvas` npm
 * package), so HTMLCanvasElement.getContext("2d") always returns null and
 * logs a "Not implemented" warning. Chart's canvas render backend always
 * requests a 2D context on init, so this fires on almost every chart test.
 * Individual specs that assert on specific draw calls install their own
 * vi.spyOn(...).mockReturnValue(...) for the duration of that test, which
 * takes precedence over this default stub.
 */
function createMockCanvasRenderingContext2D(): CanvasRenderingContext2D {
    return {
        arc: vi.fn(),
        beginPath: vi.fn(),
        bezierCurveTo: vi.fn(),
        clearRect: vi.fn(),
        clip: vi.fn(),
        closePath: vi.fn(),
        createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
        createRadialGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
        drawImage: vi.fn(),
        ellipse: vi.fn(),
        fill: vi.fn(),
        fillRect: vi.fn(),
        fillStyle: '',
        fillText: vi.fn(),
        font: '',
        getImageData: vi.fn().mockReturnValue({ data: new Uint8ClampedArray(4), height: 1, width: 1 }),
        globalAlpha: 1,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'low',
        lineJoin: 'miter',
        lineTo: vi.fn(),
        lineWidth: 1,
        measureText: vi.fn().mockReturnValue({ width: 0 }),
        moveTo: vi.fn(),
        quadraticCurveTo: vi.fn(),
        rect: vi.fn(),
        resetTransform: vi.fn(),
        restore: vi.fn(),
        rotate: vi.fn(),
        save: vi.fn(),
        scale: vi.fn(),
        setLineDash: vi.fn(),
        setTransform: vi.fn(),
        stroke: vi.fn(),
        strokeRect: vi.fn(),
        strokeStyle: '',
        strokeText: vi.fn(),
        textAlign: 'start',
        textBaseline: 'alphabetic',
        translate: vi.fn()
    } as unknown as CanvasRenderingContext2D;
}

const originalGetContext = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, contextId: string, ...args: unknown[]) {
    if (contextId === '2d') {
        return createMockCanvasRenderingContext2D();
    }
    return (originalGetContext as (...a: unknown[]) => unknown).call(this, contextId, ...args);
} as typeof HTMLCanvasElement.prototype.getContext;

HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,');

/**
 * jsdom supports getComputedStyle's pseudo-element argument in signature only;
 * passing a non-empty pseudo-element string logs "Not implemented" because it
 * cannot resolve generated content. The chart export capability analyzer probes
 * ::before/::after presence this way; falling back to the plain element style
 * keeps that probe working without the warning.
 */
const originalGetComputedStyle = window.getComputedStyle.bind(window);
window.getComputedStyle = ((element: Element) => originalGetComputedStyle(element)) as typeof window.getComputedStyle;