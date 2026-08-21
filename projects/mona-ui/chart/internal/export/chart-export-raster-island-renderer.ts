import type { ChartExportRasterIslandSnapshot } from "./chart-export-snapshot";
import type { ChartRect } from "../../models/chart.models";
import { ChartExportResourceManager } from "./chart-export-resource-manager";
import { ChartExportError } from "../../models/chart-export.models";

import {
    MAX_RASTER_DIMENSION,
    MAX_RASTER_TOTAL_PIXELS
} from "./chart-export-options";

export interface RenderedRasterIsland {
    readonly clipRect?: ChartRect;
    readonly dataUrl: string;
    readonly height: number;
    readonly id: string;
    readonly width: number;
    readonly x: number;
    readonly y: number;
}

export class ChartExportRasterIslandRenderer {
    public static async renderIslands(
        islands: readonly ChartExportRasterIslandSnapshot[],
        _styleSnapshot: ReadonlyMap<string, string>,
        scale: number = 2,
        signal?: AbortSignal
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

        // 1. Capture and inline all resources (fonts, images, media, CSS URLs)
        await ChartExportResourceManager.captureAndInlineIslandResources(
            islands.map(i => i.frozenRoot),
            signal
        );

        if (signal?.aborted) {
            throw new DOMException("Export was aborted", "AbortError");
        }

        // 2. Dynamically import html2canvas-pro
        let html2canvas: any;
        try {
            const mod = await import("html2canvas-pro");
            html2canvas = (mod as any).default ?? mod;
        } catch (err) {
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

                const effectiveScale = Math.max(0.25, scale);
                const physicalWidth = Math.ceil(island.bounds.width * effectiveScale);
                const physicalHeight = Math.ceil(island.bounds.height * effectiveScale);

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

                let targetElement: HTMLElement;
                let cleanupElement: HTMLElement;

                if (island.hasComplexTransform) {
                    // Complex transform: create capture wrapper matching visual AABB (R3-03)
                    const wrapper = document.createElement("div");
                    wrapper.style.position = "relative";
                    wrapper.style.boxSizing = "border-box";
                    wrapper.style.width = `${island.bounds.width}px`;
                    wrapper.style.height = `${island.bounds.height}px`;
                    wrapper.style.overflow = "visible";

                    island.frozenRoot.style.position = "absolute";
                    island.frozenRoot.style.boxSizing = "border-box";
                    island.frozenRoot.style.width = `${island.layoutWidth}px`;
                    island.frozenRoot.style.height = `${island.layoutHeight}px`;
                    island.frozenRoot.style.minWidth = `${island.layoutWidth}px`;
                    island.frozenRoot.style.maxWidth = `${island.layoutWidth}px`;
                    island.frozenRoot.style.minHeight = `${island.layoutHeight}px`;
                    island.frozenRoot.style.maxHeight = `${island.layoutHeight}px`;
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
                    } catch {}

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
                const allStagedElements = [targetElement, ...Array.from(targetElement.querySelectorAll<HTMLElement>("*"))];
                for (const el of allStagedElements) {
                    const top = (el as any).__monaScrollTop ?? (el.hasAttribute("data-mona-scroll-top") ? parseFloat(el.getAttribute("data-mona-scroll-top")!) : 0);
                    const left = (el as any).__monaScrollLeft ?? (el.hasAttribute("data-mona-scroll-left") ? parseFloat(el.getAttribute("data-mona-scroll-left")!) : 0);
                    if (top > 0) el.scrollTop = top;
                    if (left > 0) el.scrollLeft = left;
                }

                try {
                    const canvas = await html2canvas(targetElement, {
                        backgroundColor: null,
                        height: island.bounds.height,
                        logging: false,
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
        } catch (err: any) {
            if (err?.name === "AbortError" || err instanceof ChartExportError) {
                throw err;
            }
            throw new ChartExportError(
                "template-rasterization-failed",
                `Failed to rasterize template DOM island: ${err?.message ?? err}`,
                { cause: err }
            );
        } finally {
            stagingContainer.remove();
        }

        return results;
    }
}
