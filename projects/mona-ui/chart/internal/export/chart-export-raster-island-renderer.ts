import type { ChartExportRasterIslandSnapshot } from "./chart-export-snapshot";
import type { ChartRect } from "../../models/chart.models";
import { ChartExportResourceManager } from "./chart-export-resource-manager";
import { isolateFragmentIds } from "./chart-export-fragment-isolator";
import type { RasterDecodeEnvironment } from "./chart-export-image-decoder";
import { ChartExportError } from "../../models/chart-export.models";

import { MAX_RASTER_DIMENSION, MAX_RASTER_TOTAL_PIXELS, MAX_RASTER_TRANSACTION_PIXELS } from "./chart-export-options";

export interface RenderedRasterIsland {
    readonly clipRect?: ChartRect;
    readonly dataUrl: string;
    readonly height: number;
    readonly id: string;
    readonly width: number;
    readonly x: number;
    readonly y: number;
}

function effectiveScaleOf(scale: number): number {
    return Math.max(0.25, scale);
}

let stagingNamespaceFallbackCounter = 0;

/**
 * Creates a staging namespace that is unique across overlapping renderIslands
 * invocations (R7-01). Primitive IDs (mona-export-prim-N) restart from zero per
 * snapshot, so they are only unique within one export transaction. The
 * transaction token composes with the primitive identity to guarantee that no
 * two concurrently staged trees can introduce the same temporary DOM/SVG ID
 * into the shared staging document.
 */
function createExportStagingTransactionNamespace(): string {
    const cryptoRef = globalThis.crypto;
    if (cryptoRef && typeof cryptoRef.randomUUID === "function") {
        return `mona-export-${cryptoRef.randomUUID()}`;
    }
    stagingNamespaceFallbackCounter += 1;
    return `mona-export-${stagingNamespaceFallbackCounter}`;
}

/**
 * Transaction-wide raster pixel preflight (R6-06 / INV-08). Computes the exact
 * allocation formula used per island for every island and rejects before any
 * expensive resource or rasterizer work when the aggregate budget is exceeded.
 */
export function assertRasterTransactionBudget(
    islands: readonly ChartExportRasterIslandSnapshot[],
    scale: number
): void {
    const effectiveScale = effectiveScaleOf(scale);
    let totalPixels = 0;

    for (const island of islands) {
        const physicalWidth = Math.ceil(island.bounds.width * effectiveScale);
        const physicalHeight = Math.ceil(island.bounds.height * effectiveScale);

        if (!Number.isSafeInteger(physicalWidth) || !Number.isSafeInteger(physicalHeight)) {
            throw new ChartExportError(
                "too-large",
                `Template raster island '${island.id}' has physical dimensions beyond safe integer range.`
            );
        }

        if (
            physicalWidth > MAX_RASTER_DIMENSION ||
            physicalHeight > MAX_RASTER_DIMENSION ||
            physicalWidth * physicalHeight > MAX_RASTER_TOTAL_PIXELS
        ) {
            throw new ChartExportError(
                "too-large",
                `Template raster island dimensions (${physicalWidth}x${physicalHeight}px) exceed maximum supported size.`
            );
        }

        totalPixels += physicalWidth * physicalHeight;
    }

    if (totalPixels > MAX_RASTER_TRANSACTION_PIXELS) {
        throw new ChartExportError(
            "too-large",
            `Aggregate raster transaction pixels (${totalPixels} across ${islands.length} islands) exceed the maximum (${MAX_RASTER_TRANSACTION_PIXELS} pixels).`
        );
    }
}

export class ChartExportRasterIslandRenderer {
    public static async renderIslands(
        islands: readonly ChartExportRasterIslandSnapshot[],
        _styleSnapshot: ReadonlyMap<string, string>,
        scale: number = 2,
        signal?: AbortSignal,
        decodeEnvironment?: RasterDecodeEnvironment
    ): Promise<readonly RenderedRasterIsland[]> {
        if (islands.length === 0) {
            return [];
        }

        if (signal?.aborted) {
            throw new DOMException("Export was aborted", "AbortError");
        }

        if (typeof document === "undefined") {
            throw new ChartExportError(
                "unsupported-environment",
                "Cannot rasterize template islands in a non-browser environment."
            );
        }

        // 1. Cheap geometry budget first: per-island and aggregate pixel guards run
        // before resource capture or rasterizer loading (R6-06 §34.1)
        assertRasterTransactionBudget(islands, scale);

        // 2. Capture and inline all resources (fonts, images, media, CSS URLs)
        await ChartExportResourceManager.captureAndInlineIslandResources(
            islands.map(i => i.frozenRoot),
            signal,
            decodeEnvironment
        );

        if (signal?.aborted) {
            throw new DOMException("Export was aborted", "AbortError");
        }

        // 2.5 Namespace fragment IDs under a transaction-unique prefix composed with
        // the island identity so overlapping export transactions can never stage the
        // same ID, and no staged fragment can resolve outside its own island (R6-02 / R7-01)
        const transactionNamespace = createExportStagingTransactionNamespace();
        for (const island of islands) {
            isolateFragmentIds(island.frozenRoot, `${transactionNamespace}--${island.id}`);
        }

        if (signal?.aborted) {
            throw new DOMException("Export was aborted", "AbortError");
        }

        // 2. Dynamically import html2canvas-pro
        let html2canvas: (element: HTMLElement, options?: Record<string, unknown>) => Promise<HTMLCanvasElement>;
        try {
            const mod = await import("html2canvas-pro");
            html2canvas =
                ((mod as unknown as { default?: unknown }).default as typeof html2canvas) ??
                (mod as unknown as typeof html2canvas);
        } catch (err: unknown) {
            throw new ChartExportError(
                "template-rasterization-failed",
                "Failed to dynamically load DOM rasterizer (html2canvas-pro).",
                { cause: err }
            );
        }

        if (signal?.aborted) {
            throw new DOMException("Export was aborted", "AbortError");
        }

        // 3. Create off-screen staging container for rendering detached frozen elements
        const stagingContainer = document.createElement("div");
        stagingContainer.setAttribute("aria-hidden", "true");
        stagingContainer.style.position = "fixed";
        stagingContainer.style.left = "-99999px";
        stagingContainer.style.top = "-99999px";
        stagingContainer.style.width = "auto";
        stagingContainer.style.height = "auto";
        stagingContainer.style.pointerEvents = "none";
        stagingContainer.style.opacity = "1";
        stagingContainer.style.zIndex = "-1";
        document.body.appendChild(stagingContainer);

        const results: RenderedRasterIsland[] = [];

        try {
            for (const island of islands) {
                if (signal?.aborted) {
                    throw new DOMException("Export was aborted", "AbortError");
                }

                const effectiveScale = effectiveScaleOf(scale);

                let targetElement: HTMLElement;
                let cleanupElement: HTMLElement;

                const layoutW = island.layoutBorderBoxWidth ?? island.layoutWidth;
                const layoutH = island.layoutBorderBoxHeight ?? island.layoutHeight;

                if (island.hasComplexTransform) {
                    // Complex 2D affine transform: create capture wrapper matching visual AABB (R3-03 / R5-01 / R5-08)
                    const wrapper = document.createElement("div");
                    wrapper.style.position = "relative";
                    wrapper.style.boxSizing = "border-box";
                    wrapper.style.width = `${island.bounds.width}px`;
                    wrapper.style.height = `${island.bounds.height}px`;
                    wrapper.style.overflow = "visible";

                    island.frozenRoot.style.position = "absolute";
                    island.frozenRoot.style.boxSizing = "border-box";
                    island.frozenRoot.style.width = `${layoutW}px`;
                    island.frozenRoot.style.height = `${layoutH}px`;
                    island.frozenRoot.style.minWidth = `${layoutW}px`;
                    island.frozenRoot.style.maxWidth = `${layoutW}px`;
                    island.frozenRoot.style.minHeight = `${layoutH}px`;
                    island.frozenRoot.style.maxHeight = `${layoutH}px`;
                    if (island.transform) {
                        island.frozenRoot.style.transform = island.transform;
                    }
                    if (island.transformOrigin) {
                        island.frozenRoot.style.transformOrigin = island.transformOrigin;
                    }

                    wrapper.appendChild(island.frozenRoot);
                    stagingContainer.appendChild(wrapper);

                    // Align transformed child visual bounding box to (0,0) of wrapper
                    try {
                        const wrapperRect = wrapper.getBoundingClientRect();
                        const childRect = island.frozenRoot.getBoundingClientRect();
                        if (wrapperRect.width > 0 && childRect.width > 0) {
                            const offsetX = wrapperRect.left - childRect.left;
                            const offsetY = wrapperRect.top - childRect.top;
                            island.frozenRoot.style.left = `${offsetX}px`;
                            island.frozenRoot.style.top = `${offsetY}px`;
                        }
                    } catch {
                        // Ignore rect measuring if detached
                    }

                    targetElement = wrapper;
                    cleanupElement = wrapper;
                } else {
                    // Non-transformed element: direct bounding dimensions
                    island.frozenRoot.style.boxSizing = "border-box";
                    island.frozenRoot.style.width = `${island.bounds.width}px`;
                    island.frozenRoot.style.height = `${island.bounds.height}px`;
                    island.frozenRoot.style.minWidth = `${island.bounds.width}px`;
                    island.frozenRoot.style.maxWidth = `${island.bounds.width}px`;
                    island.frozenRoot.style.minHeight = `${island.bounds.height}px`;
                    island.frozenRoot.style.maxHeight = `${island.bounds.height}px`;

                    stagingContainer.appendChild(island.frozenRoot);
                    targetElement = island.frozenRoot;
                    cleanupElement = island.frozenRoot;
                }

                // Restore scroll positions after attaching to staging DOM (R3-09)
                const allStagedElements = [
                    targetElement,
                    ...Array.from(targetElement.querySelectorAll<HTMLElement>("*"))
                ];
                for (const el of allStagedElements) {
                    const top =
                        (el as unknown as Record<string, number>)["__monaScrollTop"] ??
                        (el.hasAttribute("data-mona-scroll-top")
                            ? parseFloat(el.getAttribute("data-mona-scroll-top")!)
                            : 0);
                    const left =
                        (el as unknown as Record<string, number>)["__monaScrollLeft"] ??
                        (el.hasAttribute("data-mona-scroll-left")
                            ? parseFloat(el.getAttribute("data-mona-scroll-left")!)
                            : 0);
                    if (top > 0) el.scrollTop = top;
                    if (left > 0) el.scrollLeft = left;
                }

                try {
                    // R5-01: Pass normalizeDom: false so html2canvas-pro does not reset Mona's frozen transforms
                    const canvas = await html2canvas(targetElement, {
                        backgroundColor: null,
                        height: island.bounds.height,
                        logging: false,
                        normalizeDom: false,
                        scale: effectiveScale,
                        useCORS: true,
                        width: island.bounds.width,
                        windowHeight: island.bounds.height,
                        windowWidth: island.bounds.width,
                        signal
                    });

                    if (signal?.aborted) {
                        throw new DOMException("Export was aborted", "AbortError");
                    }

                    const dataUrl = canvas.toDataURL("image/png");

                    results.push({
                        clipRect: island.clipRect,
                        dataUrl,
                        height: island.bounds.height,
                        id: island.id,
                        width: island.bounds.width,
                        x: island.bounds.x,
                        y: island.bounds.y
                    });
                } finally {
                    cleanupElement.remove();
                }
            }
        } catch (err: unknown) {
            if ((err as { name?: string })?.name === "AbortError" || err instanceof ChartExportError) {
                throw err;
            }
            throw new ChartExportError(
                "template-rasterization-failed",
                `Failed to rasterize template DOM island: ${(err as Error)?.message ?? err}`,
                { cause: err }
            );
        } finally {
            stagingContainer.remove();
        }

        return results;
    }
}
