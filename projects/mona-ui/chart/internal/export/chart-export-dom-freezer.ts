import { ChartExportError } from "../../models/chart-export.models";
import { MAX_EXPORT_RESOURCE_DIMENSION, MAX_EXPORT_RESOURCE_PIXELS } from "./chart-export-resource-policy";

/**
 * Validates that a source canvas backing store is within the bitmap budget
 * BEFORE any destination backing-store allocation occurs (R6-06 / INV-07).
 * A visually small canvas can describe an enormous bitmap; CSS display size
 * never bounds the backing store.
 */
function assertCanvasBackingStoreBudget(canvas: HTMLCanvasElement): void {
    const width = canvas.width;
    const height = canvas.height;

    if (!Number.isFinite(width) || !Number.isFinite(height)) {
        return;
    }
    if (width <= 0 || height <= 0) {
        return;
    }

    const pixels = width * height;
    if (
        width > MAX_EXPORT_RESOURCE_DIMENSION ||
        height > MAX_EXPORT_RESOURCE_DIMENSION ||
        !Number.isSafeInteger(pixels) ||
        pixels > MAX_EXPORT_RESOURCE_PIXELS
    ) {
        throw new ChartExportError(
            "too-large",
            `Template canvas backing store (${width}x${height}) exceeds the export bitmap budget ` +
                `(max ${MAX_EXPORT_RESOURCE_DIMENSION}px edge, ${MAX_EXPORT_RESOURCE_PIXELS} pixels).`
        );
    }
}

export class ChartExportDomFreezer {
    /**
     * Deeply freezes a cloned DOM tree by copying all computed styles and runtime state
     * from the source tree, making it completely independent of subsequent live DOM or CSS changes.
     * Freeze-critical failures throw explicit ChartExportErrors instead of silently producing half-frozen subtrees (R5-11).
     */
    public static freeze(sourceNode: HTMLElement, cloneNode: HTMLElement): void {
        if (!sourceNode || !cloneNode || typeof window === "undefined") {
            return;
        }

        const sourceElements = [sourceNode, ...Array.from(sourceNode.querySelectorAll<HTMLElement>("*"))];
        const cloneElements = [cloneNode, ...Array.from(cloneNode.querySelectorAll<HTMLElement>("*"))];

        for (let i = 0; i < sourceElements.length && i < cloneElements.length; i++) {
            const src = sourceElements[i];
            const dst = cloneElements[i];
            if (!src || !dst) continue;

            const tagName = dst.tagName.toLowerCase();
            if (tagName === "script") {
                dst.remove();
                continue;
            }

            // Preserve scroll position (R3-09)
            if (src.scrollTop > 0 || src.scrollLeft > 0) {
                (dst as unknown as Record<string, number>)["__monaScrollTop"] = src.scrollTop;
                (dst as unknown as Record<string, number>)["__monaScrollLeft"] = src.scrollLeft;
                dst.setAttribute("data-mona-scroll-top", String(src.scrollTop));
                dst.setAttribute("data-mona-scroll-left", String(src.scrollLeft));
            }

            try {
                const computed = window.getComputedStyle(src);

                // Enumerate and copy all resolved computed styles inline
                if (computed.length > 0) {
                    for (let j = 0; j < computed.length; j++) {
                        const prop = computed[j];
                        if (prop) {
                            const val = computed.getPropertyValue(prop);
                            if (val) {
                                dst.style.setProperty(prop, val);
                            }
                        }
                    }
                } else {
                    // Fallback for environments where computed style indexing is limited
                    dst.style.fontFamily = computed.fontFamily;
                    dst.style.fontSize = computed.fontSize;
                    dst.style.fontWeight = computed.fontWeight;
                    dst.style.fontStyle = computed.fontStyle;
                    dst.style.lineHeight = computed.lineHeight;
                    dst.style.letterSpacing = computed.letterSpacing;
                    dst.style.color = computed.color;
                    dst.style.textAlign = computed.textAlign;
                    dst.style.backgroundColor = computed.backgroundColor;
                    dst.style.backgroundImage = computed.backgroundImage;
                    dst.style.boxSizing = computed.boxSizing;
                    dst.style.padding = computed.padding;
                    dst.style.margin = computed.margin;
                    dst.style.border = computed.border;
                    dst.style.borderRadius = computed.borderRadius;
                    dst.style.boxShadow = computed.boxShadow;
                    dst.style.display = computed.display;
                    dst.style.opacity = computed.opacity;
                }

                // Explicit export overrides: disable transitions, animations, caret
                dst.style.setProperty("animation", "none", "important");
                dst.style.setProperty("transition", "none", "important");
                dst.style.caretColor = "transparent";

                // Animation suppression check (EXP-03 / R2-09):
                // ONLY honor explicit Mona suppression marker, never generic consumer opacity-0
                const isMonaSuppressed =
                    src.getAttribute("data-mona-chart-export-animation-suppression") === "opacity";

                if (isMonaSuppressed) {
                    dst.style.opacity = "1";
                    dst.removeAttribute("data-mona-chart-export-animation-suppression");
                } else {
                    dst.style.opacity = computed.opacity;
                }

                // Preserve runtime interactive & media DOM state
                if (src instanceof HTMLInputElement && dst instanceof HTMLInputElement) {
                    dst.value = src.value;
                    if (src.type === "checkbox" || src.type === "radio") {
                        dst.checked = src.checked;
                    }
                } else if (src instanceof HTMLTextAreaElement && dst instanceof HTMLTextAreaElement) {
                    dst.value = src.value;
                } else if (src instanceof HTMLSelectElement && dst instanceof HTMLSelectElement) {
                    dst.selectedIndex = src.selectedIndex;
                } else if (src instanceof HTMLDetailsElement && dst instanceof HTMLDetailsElement) {
                    dst.open = src.open;
                } else if (src instanceof HTMLImageElement && dst instanceof HTMLImageElement) {
                    dst.src = src.currentSrc || src.src;
                } else if (src instanceof HTMLCanvasElement && dst instanceof HTMLCanvasElement) {
                    // Backing-store budget must be enforced before any bitmap allocation (R6-06)
                    assertCanvasBackingStoreBudget(src);

                    // Check for tainted canvas and copy bitmap synchronously (R3-02)
                    try {
                        const srcCtx = src.getContext("2d");
                        if (srcCtx && src.width > 0 && src.height > 0) {
                            srcCtx.getImageData(0, 0, 1, 1);
                        }
                    } catch (err: unknown) {
                        throw new ChartExportError(
                            "resource-load-failed",
                            "Template canvas is cross-origin tainted and cannot be exported.",
                            { cause: err }
                        );
                    }

                    try {
                        const dstCtx = dst.getContext("2d");
                        if (dstCtx && src.width > 0 && src.height > 0) {
                            dst.width = src.width;
                            dst.height = src.height;
                            dstCtx.drawImage(src, 0, 0);
                        }
                    } catch (err: unknown) {
                        throw new ChartExportError(
                            "resource-load-failed",
                            "Failed to copy template canvas bitmap for export.",
                            { cause: err }
                        );
                    }
                }
            } catch (err: unknown) {
                if (err instanceof ChartExportError) {
                    throw err;
                }
                throw new ChartExportError(
                    "template-rasterization-failed",
                    `Failed to freeze element computed styles or runtime state: ${(err as Error)?.message ?? err}`,
                    { cause: err }
                );
            }
        }

        // Freeze responsive-image selection so the staged clone can only display the
        // already-selected image bytes and can never reselect a live URL (R4-02)
        ChartExportDomFreezer.neutralizeResponsiveImageSelection(cloneNode);
    }

    /**
     * Removes responsive-image reselection surfaces from a frozen clone:
     * <picture><source> candidates are deleted and img srcset/sizes attributes removed,
     * so attaching the clone to a staging document cannot trigger new resource selection.
     */
    public static neutralizeResponsiveImageSelection(cloneRoot: HTMLElement): void {
        const rootTag = cloneRoot.tagName.toLowerCase();

        const pictures =
            rootTag === "picture" ? [cloneRoot] : Array.from(cloneRoot.querySelectorAll("picture"));
        for (const picture of pictures) {
            for (const source of Array.from(picture.querySelectorAll("source"))) {
                source.remove();
            }
        }

        const images =
            rootTag === "img" ? [cloneRoot as HTMLImageElement] : Array.from(cloneRoot.querySelectorAll("img"));
        for (const img of images) {
            img.removeAttribute("srcset");
            img.removeAttribute("sizes");
        }
    }
}
